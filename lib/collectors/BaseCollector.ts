import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent } from '../types';
import { getGeocodingService } from '../services/GeocodingService';
import { getCountryBoundingBox } from '../utils/GeoJSONGenerator';

export interface CollectorConfig {
    name: string;
    cacheDurationSeconds: number;
    rateLimitPerMinute?: number;
    rateLimitPerDay?: number;
    rateLimitPerYear?: number;
    maxRetries: number;
    circuitBreakerThreshold: number;
    circuitBreakerTimeout: number; // seconds
}

export interface CollectorStatus {
    enabled: boolean;
    circuit_open: boolean;
    circuit_open_until: Date | null;
    consecutive_failures: number;
    last_success_at: Date | null;
    cache_duration_seconds: number;
    rate_limit_per_minute?: number;
    rate_limit_per_day?: number;
    rate_limit_per_year?: number;
}

/**
 * Base class for all data collectors
 * Handles: caching, rate limiting, retries, circuit breaker
 */
export abstract class BaseCollector {
    protected config: CollectorConfig;
    protected supabase: SupabaseClient;

    constructor(config: CollectorConfig, supabase: SupabaseClient) {
        this.config = config;
        this.supabase = supabase;
    }

    /**
     * Main entry point - handles caching, rate limiting, retries
     */
    async collect(): Promise<MonitorEvent[]> {
        try {
            // 1. Check if enabled
            const status = await this.getStatus();
            if (!status) {
                console.log(`⏸️ ${this.config.name}: Not configured in database`);
                return [];
            }

            if (!status.enabled) {
                console.log(`⏸️ ${this.config.name}: Disabled`);
                return [];
            }

            // 2. Check circuit breaker
            if (status.circuit_open && status.circuit_open_until && status.circuit_open_until > new Date()) {
                console.log(`🔴 ${this.config.name}: Circuit open until ${status.circuit_open_until.toISOString()}`);
                return await this.getCachedEvents() || [];
            }

            // 3. Check cache
            const cached = await this.getCachedEvents();
            if (cached && cached.length > 0) {
                console.log(`💾 ${this.config.name}: Using cached data (${cached.length} events)`);
                return cached;
            }

            // 4. Check rate limits
            const withinLimits = await this.checkRateLimits(status);
            if (!withinLimits) {
                console.log(`⏱️ ${this.config.name}: Rate limit exceeded, using stale cache`);
                return cached || [];
            }

            // 5. Fetch with retry logic
            const events = await this.fetchWithRetry();

            // 6. Store in database
            if (events && events.length > 0) {
                await this.storeEvents(events);
                await this.updateStatus(true, null, events.length);
            } else {
                console.log(`ℹ️ ${this.config.name}: No events returned`);
                await this.updateStatus(true, null, 0);
            }

            return events || [];

        } catch (error) {
            console.error(`❌ ${this.config.name}: Collection failed:`, error);
            const cached = await this.getCachedEvents();
            return cached || [];
        }
    }

    /**
     * Fetch with exponential backoff retry
     */
    private async fetchWithRetry(): Promise<MonitorEvent[]> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const startTime = Date.now();

                // Call the concrete implementation
                const events = await this.fetchData();

                const responseTime = Date.now() - startTime;
                await this.logRequest(true, responseTime);

                console.log(`✅ ${this.config.name}: Fetched ${events.length} events (${responseTime}ms)`);
                return events;

            } catch (error) {
                lastError = error as Error;
                await this.logRequest(false, 0, lastError.message);

                if (attempt < this.config.maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`⚠️ ${this.config.name}: Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
                    await this.sleep(waitTime);
                }
            }
        }

        // All retries failed
        console.error(`❌ ${this.config.name}: All ${this.config.maxRetries} attempts failed:`, lastError);
        await this.updateStatus(false, lastError?.message || 'Unknown error', 0);
        throw lastError || new Error('Unknown error');
    }

    /**
     * Check rate limits
     */
    private async checkRateLimits(status: CollectorStatus): Promise<boolean> {
        try {
            // Check per-minute limit
            if (status.rate_limit_per_minute) {
                const { data, error } = await this.supabase
                    .rpc('get_request_count', {
                        p_collector_name: this.config.name,
                        p_time_window_seconds: 60
                    });

                if (error) {
                    console.error(`Error checking minute rate limit:`, error);
                    return true; // Fail open
                }

                if (data >= status.rate_limit_per_minute) {
                    console.log(`⏱️ ${this.config.name}: Per-minute limit exceeded (${data}/${status.rate_limit_per_minute})`);
                    return false;
                }
            }

            // Check per-day limit
            if (status.rate_limit_per_day) {
                const { data, error } = await this.supabase
                    .rpc('get_request_count', {
                        p_collector_name: this.config.name,
                        p_time_window_seconds: 86400 // 24 hours
                    });

                if (error) {
                    console.error(`Error checking daily rate limit:`, error);
                    return true; // Fail open
                }

                if (data >= status.rate_limit_per_day) {
                    console.log(`⏱️ ${this.config.name}: Per-day limit exceeded (${data}/${status.rate_limit_per_day})`);
                    return false;
                }
            }

            // Check per-year limit (critical for ACLED)
            if (status.rate_limit_per_year) {
                const { data, error } = await this.supabase
                    .rpc('get_request_count', {
                        p_collector_name: this.config.name,
                        p_time_window_seconds: 31536000 // 365 days
                    });

                if (error) {
                    console.error(`Error checking yearly rate limit:`, error);
                    return true; // Fail open
                }

                if (data >= status.rate_limit_per_year) {
                    console.log(`🚨 ${this.config.name}: YEARLY limit exceeded (${data}/${status.rate_limit_per_year})!`);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error(`Error in checkRateLimits:`, error);
            return true; // Fail open (allow request to proceed)
        }
    }

    /**
     * Get cached events from database
     */
    private async getCachedEvents(): Promise<MonitorEvent[] | null> {
        try {
            const { data, error } = await this.supabase
                .rpc('get_cached_events', {
                    p_collector_name: this.config.name,
                    p_cache_duration_seconds: this.config.cacheDurationSeconds
                });

            if (error) {
                console.error(`Error getting cached events:`, error);
                return null;
            }

            if (!data || data.length === 0) {
                return null;
            }

            return data.map((dbEvent: any) => this.dbEventToMonitorEvent(dbEvent));
        } catch (error) {
            console.error(`Error in getCachedEvents:`, error);
            return null;
        }
    }

    /**
     * Store events in database
     */
    private async storeEvents(events: MonitorEvent[]): Promise<void> {
        try {
            // Clear old events from this collector
            await this.supabase
                .rpc('clear_collector_events', {
                    p_collector_name: this.config.name
                });

            // ⭐ AUTO-GEOCODING: Fix (0,0) coordinates before storage
            const geocodingService = getGeocodingService();
            const CONCURRENCY_LIMIT = 3;

            // Process sequentially or in small batches to respect rate limits if using nominatim fallback
            // For now, simple sequential loop to avoid blasting API
            for (const event of events) {
                if (Math.abs(event.coordinates.lat) < 0.0001 && Math.abs(event.coordinates.lng) < 0.0001) {
                    const text = `${event.title}. ${event.description || ''}`.substring(0, 500);
                    if (text.length > 15) {
                        try {
                            const result = await geocodingService.geocode({
                                text,
                                priority: 'high', // Prefer AI
                                context: { country: null }
                            });

                            if (result.success && result.location) {
                                event.coordinates = { lat: result.location.lat, lng: result.location.lng };
                                event.location = result.location.address || result.location.city || event.location;
                                // console.log(`📍 Fixed location for: ${event.title.substring(0,20)}...`);
                            }
                        } catch (e: any) {
                            // If quota exceeded, stop hammering the API
                            if (e.message?.includes('429') || e.message?.includes('Quota') || e.message?.includes('RESOURCE_EXHAUSTED')) {
                                console.warn(`🛑 ${this.config.name}: Geocoding Quota Exceeded. Stopping auto-geocode for this batch.`);
                                break;
                            }
                            console.warn(`⚠️ ${this.config.name}: Auto-geocode failed for "${event.title.substring(0, 15)}..."`);
                        }
                        // Small delay to be nice to APIs
                        await new Promise(r => setTimeout(r, 1000)); // Increased to 1s
                    }
                }
            }

            // Insert new events
            const dbEvents = events.map(event => {
                // Map Polygon Logic: Attach geometry if Critical/War and matches country
                let alertGeometry = null;
                if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
                    // Try to match country name in location or title to get bounding box
                    // Simple heuristic: check location string first
                    if (event.location) {
                        alertGeometry = getCountryBoundingBox(event.location);
                    }
                    // Fallback check title if no location match
                    if (!alertGeometry) {
                        alertGeometry = getCountryBoundingBox(event.title);
                    }
                }

                return {
                    lat: event.coordinates.lat,
                    lng: event.coordinates.lng,
                    category: event.category,
                    severity: event.severity === 'CRITICAL' ? 'HIGH' : event.severity,
                    priority: event.priority || (event.severity === 'HIGH' || event.severity === 'CRITICAL' ? 1 : 3), // Default priority if missing
                    title: event.title,
                    description: event.description || '',
                    location: event.location || '',
                    source_name: event.sourceName,
                    source_type: event.sourceType,
                    source_url: event.sourceUrl || '',
                    media_url: event.mediaUrl || null,
                    media_type: event.mediaType || null,
                    event_timestamp: event.timestamp,
                    collector_name: this.config.name,
                    fetched_at: new Date().toISOString(),
                    metadata: {
                        conflictLevel: event.conflictLevel || null,
                    },
                };
            });

            const { error } = await this.supabase
                .from('events')
                .insert(dbEvents);

            if (error) {
                console.error(`Failed to store events for ${this.config.name}:`, error);
            } else {
                console.log(`💾 ${this.config.name}: Stored ${events.length} events`);
            }
        } catch (error) {
            console.error(`Error in storeEvents:`, error);
        }
    }

    /**
     * Log request for rate limiting
     */
    private async logRequest(success: boolean, responseTime: number, errorMessage?: string): Promise<void> {
        try {
            await this.supabase
                .from('rate_limit_log')
                .insert({
                    collector_name: this.config.name,
                    success,
                    response_time_ms: responseTime,
                    error_message: errorMessage || null
                });
        } catch (error) {
            // Don't fail the collection if logging fails
            console.error(`Failed to log request:`, error);
        }
    }

    /**
     * Update collector status
     */
    private async updateStatus(success: boolean, errorMessage: string | null, eventCount: number): Promise<void> {
        try {
            const { data: status } = await this.supabase
                .from('collector_status')
                .select('*')
                .eq('collector_name', this.config.name)
                .single();

            if (!status) return;

            const consecutiveFailures = success ? 0 : (status.consecutive_failures + 1);
            const shouldOpenCircuit = consecutiveFailures >= status.circuit_breaker_threshold;

            const updates: any = {
                last_run_at: new Date().toISOString(),
                total_runs: status.total_runs + 1,
                consecutive_failures: consecutiveFailures
            };

            if (success) {
                updates.last_success_at = new Date().toISOString();
                updates.total_successes = status.total_successes + 1;
                updates.circuit_open = false;
                updates.circuit_open_until = null;
            } else {
                updates.last_error_at = new Date().toISOString();
                updates.last_error_message = errorMessage;
                updates.total_failures = status.total_failures + 1;

                if (shouldOpenCircuit) {
                    updates.circuit_open = true;
                    updates.circuit_open_until = new Date(
                        Date.now() + status.circuit_breaker_timeout_seconds * 1000
                    ).toISOString();
                    console.log(`🔴 ${this.config.name}: Circuit breaker OPENED until ${updates.circuit_open_until}`);
                }
            }

            // Calculate next run time based on cache duration
            updates.next_run_at = new Date(
                Date.now() + this.config.cacheDurationSeconds * 1000
            ).toISOString();

            await this.supabase
                .from('collector_status')
                .update(updates)
                .eq('collector_name', this.config.name);

        } catch (error) {
            console.error(`Error updating status:`, error);
        }
    }

    /**
     * Get current status from database
     */
    private async getStatus(): Promise<CollectorStatus | null> {
        try {
            const { data, error } = await this.supabase
                .from('collector_status')
                .select('*')
                .eq('collector_name', this.config.name)
                .single();

            if (error || !data) {
                return null;
            }

            return {
                enabled: data.enabled,
                circuit_open: data.circuit_open,
                circuit_open_until: data.circuit_open_until ? new Date(data.circuit_open_until) : null,
                consecutive_failures: data.consecutive_failures,
                last_success_at: data.last_success_at ? new Date(data.last_success_at) : null,
                cache_duration_seconds: data.cache_duration_seconds,
                rate_limit_per_minute: data.rate_limit_per_minute,
                rate_limit_per_day: data.rate_limit_per_day,
                rate_limit_per_year: data.rate_limit_per_year
            };
        } catch (error) {
            console.error(`Error getting status:`, error);
            return null;
        }
    }

    // Utility methods
    protected sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private dbEventToMonitorEvent(dbEvent: any): MonitorEvent {
        return {
            id: dbEvent.id,
            title: dbEvent.title,
            description: dbEvent.description,
            category: dbEvent.category,
            severity: dbEvent.severity,
            sourceType: dbEvent.source_type,
            sourceName: dbEvent.source_name,
            location: dbEvent.location,
            coordinates: { lat: dbEvent.lat, lng: dbEvent.lng },
            timestamp: dbEvent.event_timestamp,
            sourceUrl: dbEvent.source_url,
            conflictLevel: dbEvent.metadata?.conflictLevel
        };
    }

    /**
     * Abstract method - must be implemented by concrete collectors
     */
    protected abstract fetchData(): Promise<MonitorEvent[]>;
}
