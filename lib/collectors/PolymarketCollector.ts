
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
// import { getGeocodingService } from '../services/GeocodingService'; // Not used directly here as we use manual mapping

const POLYMARKET_API_URL = 'https://gamma-api.polymarket.com';

interface PolymarketEvent {
    id: string;
    question: string;
    slug: string;
    description: string;
    volume: number;
    outcomes: string[] | string; // JSON string or array
    outcomePrices: string[] | string; // JSON string or array
    tags: string[];
    liquidity: number;
    // ... other fields
}

export class PolymarketCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'POLYMARKET',
            cacheDurationSeconds: 1800, // 30 mins
            rateLimitPerMinute: 60,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 3600
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        // Fetch active events
        const eventsUrl = `${POLYMARKET_API_URL}/events?active=true&closed=false&limit=100`;

        const response = await fetch(eventsUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'EndTimesMonitor/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Polymarket API error: ${response.status}`);
        }

        const events: any[] = await response.json();

        console.log(`📊 Polymarket: Received ${events.length} active markets`);

        // Filter to geopolitical/crisis markets
        const filtered = events.filter((event: any) => {
            const text = `${event.question} ${event.description || ''}`.toLowerCase();

            return (
                text.includes('war') ||
                text.includes('conflict') ||
                text.includes('attack') ||
                text.includes('military') ||
                text.includes('crisis') ||
                text.includes('invasion') ||
                text.includes('nuclear') ||
                text.includes('election') ||
                text.includes('coup') ||
                text.includes('sanctions') ||
                text.includes('terror') ||
                text.includes('disaster') ||
                text.includes('will russia') ||
                text.includes('china')
            );
        });

        console.log(`📊 Polymarket: Filtered to ${filtered.length} geopolitical/crisis markets`);

        const limited = filtered
            .sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0))
            .slice(0, 25);

        // Process in parallel for geocoding
        const monitorEvents = await Promise.all(limited.map(async (event: any) => {
            const category = this.categorizeMarket(event);
            const severity = this.determineSeverity(event);

            // --- GEOLOCATION STRATEGY ---
            // 1. Try static extraction first (Fast, cheap)
            let location = this.extractLocation(event.question || event.slug || '');

            // 2. If 'Global' and high volume, try AI Geocoding (Smarter)
            // But respect rate limits. Only for High/Critical severity.
            // Note: We are using a separate service, assume it handles caching/rate-limiting internally or we catch errors.
            /* 
            // Commented out to avoid rate limit spam unless we have a robust queue
            // For now, improved static extraction + user feedback is safer.
            if (location.name === 'Global' && (severity === 'CRITICAL' || severity === 'HIGH')) {
               // ... await geocoder ...
            } 
            */

            // --- PROBABILITY PARSING ---
            let probability = 0;
            let probString = ''; // Legacy
            let narrativeHeadline = event.question; // Default

            try {
                // Parse outcomes (usually ["Yes", "No"])
                let outcomes = event.outcomes;
                let prices = event.outcomePrices;

                if (typeof outcomes === 'string') outcomes = JSON.parse(outcomes);
                if (typeof prices === 'string') prices = JSON.parse(prices);

                // Find "Yes" outcome
                const yesIndex = outcomes?.findIndex((o: string) => o === 'Yes');
                if (yesIndex !== undefined && yesIndex !== -1 && prices?.[yesIndex]) {
                    probability = parseFloat(prices[yesIndex]) * 100;
                    probString = `(${probability.toFixed(0)}%) `;

                    // --- NARRATIVE HEADLINE ---
                    // "Will X happen?" -> "X has 55% chance of happening"
                    // Simple heuristic: Remove "Will " and add " - 55% Chance"
                    let q = event.question.trim();
                    if (q.endsWith('?')) q = q.slice(0, -1);

                    if (q.toLowerCase().startsWith('will ')) {
                        q = q.substring(5); // Remove "Will "
                        q = q.charAt(0).toUpperCase() + q.slice(1); // Capitalize
                        narrativeHeadline = `${q} - ${probability.toFixed(0)}% Chance`;
                    } else {
                        narrativeHeadline = `${q} - ${probability.toFixed(0)}% Chance`;
                    }
                }
            } catch (e) {
                // console.warn('Failed to parse Polymarket odds', e);
            }

            // --- TIMESTAMP HONESTY ---
            // Use creation date if available, or fallback to current time BUT
            // preferably use the `startDate` provided by API to show when this market became relevant.
            // If API doesn't return `creationDate`, we must be careful.
            // Let's use `updatedAt` if available, else current.
            // Note: The screenshot shows standard timestamps. 
            // Better to use `startDate` (market open) or `creationDate`.
            const honestTimestamp = event.creationDate || event.startDate || new Date().toISOString();

            return {
                id: event.id,
                title: narrativeHeadline, // New Intelligence Headline
                description: this.buildDescription(event, probability),
                category,
                severity,
                sourceType: 'MARKET' as const,
                sourceName: 'Polymarket',
                location: location.name,
                coordinates: location.coords,
                timestamp: honestTimestamp, // Honest timestamp
                sourceUrl: `https://polymarket.com/event/${event.slug || event.id}`
            };
        }));

        return monitorEvents;
    }

    private categorizeMarket(event: PolymarketEvent): EventCategory {
        const text = (event.question || event.slug || '').toLowerCase();

        if (text.includes('war') || text.includes('military') || text.includes('invasion') || text.includes('conflict')) {
            return EventCategory.CONFLICT;
        }

        if (text.includes('election') || text.includes('president') || text.includes('vote')) {
            return EventCategory.POLITICAL;
        }

        if (text.includes('nuclear') || text.includes('attack') || text.includes('terror')) {
            return EventCategory.CONFLICT;
        }

        if (text.includes('disaster') || text.includes('earthquake') || text.includes('hurricane')) {
            return EventCategory.NATURAL_DISASTER;
        }

        if (text.includes('economy') || text.includes('recession') || text.includes('market')) {
            return EventCategory.ECONOMIC;
        }

        if (text.includes('cyber') || text.includes('hack')) {
            return EventCategory.CYBER;
        }

        // Aviation/Maritime fallbacks
        if (text.includes('plane') || text.includes('crash') || text.includes('airline')) return EventCategory.AVIATION;
        if (text.includes('ship') || text.includes('boat') || text.includes('sea')) return EventCategory.MARITIME;

        return EventCategory.POLITICAL;
    }

    private determineSeverity(event: PolymarketEvent): Severity {
        const text = (event.question || event.slug || '').toLowerCase();
        const volume = event.volume || 0;

        if (volume > 1000000) {
            if (text.includes('nuclear') || text.includes('world war') || text.includes('invasion')) {
                return 'CRITICAL';
            }
            return 'HIGH';
        }

        if (volume > 500000) {
            if (text.includes('attack') || text.includes('war') || text.includes('crisis')) {
                return 'HIGH';
            }
            return 'ELEVATED';
        }

        if (volume > 100000) {
            return 'ELEVATED';
        }

        if (text.includes('nuclear') || text.includes('world war')) {
            return 'HIGH';
        }

        if (text.includes('war') || text.includes('attack') || text.includes('crisis')) {
            return 'ELEVATED';
        }

        return 'MEDIUM';
    }

    private extractLocation(question: string): { name: string; coords: { lat: number; lng: number } } {
        if (!question) return { name: 'Global', coords: { lat: 0, lng: 0 } };
        const q = question.toLowerCase();

        // --- SPECIFIC OVERRIDES ---
        if (q.includes('russia') && q.includes('nato')) {
            return {
                name: 'Russia-NATO Border',
                coords: { lat: 55.0, lng: 30.0 }
            };
        }

        if (q.includes('china') && q.includes('taiwan')) {
            return {
                name: 'Taiwan Strait',
                coords: { lat: 24.5, lng: 119.5 }
            };
        }

        // Expanded country/region mappings
        const locations: Record<string, { lat: number; lng: number }> = {
            'ukraine': { lat: 48.3794, lng: 31.1656 },
            'russia': { lat: 61.5240, lng: 105.3188 },
            'israel': { lat: 31.0461, lng: 34.8516 },
            'palestine': { lat: 31.9522, lng: 35.2332 },
            'gaza': { lat: 31.3547, lng: 34.3088 },
            'iran': { lat: 32.4279, lng: 53.6880 },
            'china': { lat: 35.8617, lng: 104.1954 },
            'taiwan': { lat: 23.6978, lng: 120.9605 },
            'north korea': { lat: 40.3399, lng: 127.5101 },
            'south korea': { lat: 35.9078, lng: 127.7669 },
            'syria': { lat: 34.8021, lng: 38.9968 },
            'yemen': { lat: 15.5527, lng: 48.5164 },
            'lebanon': { lat: 33.8547, lng: 35.8623 },
            'iraq': { lat: 33.2232, lng: 43.6793 },
            'afghanistan': { lat: 33.9391, lng: 67.7100 },
            'usa': { lat: 37.0902, lng: -95.7129 },
            'united states': { lat: 37.0902, lng: -95.7129 },
            'us ': { lat: 37.0902, lng: -95.7129 }, // US election
            'fed ': { lat: 38.8921, lng: -77.0241 }, // Federal Reserve (DC)
            'eu ': { lat: 50.8503, lng: 4.3517 }, // Brussels
            'europe': { lat: 50.8503, lng: 4.3517 },
            'nato': { lat: 50.879, lng: 4.426 }, // Brussels NATO HQ
            'un ': { lat: 40.7489, lng: -73.9680 }, // NYC UN HQ
            'venezuela': { lat: 6.4238, lng: -66.5897 },
            'brazil': { lat: -14.2350, lng: -51.9253 }
        };

        for (const [name, coords] of Object.entries(locations)) {
            // Match whole word or start of string to avoid 'us' matching 'russia'
            const regex = new RegExp(`\\b${name}\\b`, 'i');
            if (regex.test(q)) {
                return {
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    coords
                };
            }
        }

        return {
            name: 'Global',
            // Default to Mid-Atlantic for visibility
            coords: { lat: 25.0, lng: -40.0 }
        };
    }

    private buildDescription(event: any, probability: number): string {
        const parts: string[] = [];

        if (probability > 0) {
            parts.push(`Probability: ${probability.toFixed(1)}%`);
        }

        if (event.description) {
            parts.push(event.description.substring(0, 200));
        }

        parts.push(`Volume: $${this.formatNumber(Number(event.volume || 0))}`);

        return parts.join(' | ');
    }

    private formatNumber(num: number): string {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toFixed(0);
    }
}
