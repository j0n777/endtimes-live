import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import { getGeocodingService } from '../services/GeocodingService';
import { resolveLocation } from '../services/LocationResolver';

const GDELT_API_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

interface GDELTArticle {
    url: string;
    title: string;
    seendate: string;
    domain: string;
    language: string;
    sourcecountry: string;
    theme?: string;
    tone?: number;
}

/**
 * GDELT Collector - Global Database of Events, Language and Tone
 * Source: GDELT Project API
 * Data: Global news monitoring, conflicts, events
 * Requires: AI geocoding for accurate location extraction
 */
export class GDELTCollector extends BaseCollector {
    private geocoder = getGeocodingService();

    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'GDELT',
            cacheDurationSeconds: 900, // 15 minutes
            rateLimitPerMinute: 20,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 1800
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        // Attempt 1: Specific Conflict Query
        try {
            return await this.fetchWithQuery('("war" OR "conflict" OR "attack") tone<-4');
        } catch (error) {
            console.warn('GDELT: Complex query failed, trying simple query...');
            // Attempt 2: Simple Query
            return await this.fetchWithQuery('crisis OR disaster');
        }
    }

    private async fetchWithQuery(queryFromCaller: string): Promise<MonitorEvent[]> {
        const mode = 'ArtList';
        const format = 'json';
        const maxrecords = '50'; // Reduced to ensure success
        const timespan = '24h';
        const sortby = 'Date'; // Sort by date for freshness

        const url = `${GDELT_API_URL}?query=${encodeURIComponent(queryFromCaller)}&mode=${mode}&format=${format}&maxrecords=${maxrecords}&timespan=${timespan}&sortby=${sortby}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'EndTimesMonitor/1.0'
            }
        });

        if (!response.ok) {
            // GDELT often returns 200 even for errors with text body
            throw new Error(`GDELT API error status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        const text = await response.text();

        // Check if response is JSON
        if (!text.trim().startsWith('{')) {
            console.warn(`GDELT: Received Invalid JSON: ${text.substring(0, 100)}...`);
            if (text.includes("complexity")) {
                throw new Error("GDELT Query too complex");
            }
            return [];
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.warn('GDELT: JSON parse error', e);
            return [];
        }

        const articles: GDELTArticle[] = data.articles || [];
        console.log(`📰 GDELT: Received ${articles.length} news articles for query "${queryFromCaller}"`);

        // Process with AI geocoding (limit to top 10 to save quotas/time)
        const limited = articles.slice(0, 10);
        const events: MonitorEvent[] = [];

        // Process in parallel with promise all for speed
        const processingPromises = limited.map(article => this.processArticle(article));
        const results = await Promise.allSettled(processingPromises);

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                events.push(result.value);
            }
        });

        console.log(`📰 GDELT: Successfully processed ${events.length} events with geocoding`);
        return events;
    }

    private async processArticle(article: GDELTArticle): Promise<MonitorEvent | null> {
        // Basic validation
        if (!article.title || !article.url) return null;

        let coordinates = { lat: 0, lng: 0 };
        let location = article.sourcecountry || 'Unknown';

        const severity = this.determineSeverity(article);

        // Step 1: Try keyword resolver first (zero API cost, high accuracy)
        const resolved = resolveLocation(article.title, '', 'GDELT');
        if (resolved) {
            coordinates = resolved.coords;
            location = resolved.name;
        } else if (severity === 'CRITICAL' || severity === 'HIGH') {
            // Step 2: AI geocoding only for high-priority items that keyword-matching couldn't resolve
            const geocodeResult = await this.geocoder.geocode({
                text: article.title,
                context: { country: article.sourcecountry },
                priority: 'high'
            });

            if (geocodeResult.success && geocodeResult.location) {
                coordinates = { lat: geocodeResult.location.lat, lng: geocodeResult.location.lng };
                location = geocodeResult.location.city || geocodeResult.location.country || location;
            }
        }

        return {
            id: this.generateId(article.url),
            title: article.title,
            description: `Source: ${article.domain} | Tone: ${article.tone?.toFixed(1) || 'N/A'}`,
            category: this.categorizeArticle(article),
            severity: severity,
            sourceType: 'NEWS' as const,
            sourceName: 'GDELT',
            location,
            coordinates,
            timestamp: this.parseDate(article.seendate),
            sourceUrl: article.url
        };
    }

    private categorizeArticle(article: GDELTArticle): EventCategory {
        const title = article.title?.toLowerCase() || '';

        if (title.includes('attack') || title.includes('military') || title.includes('war') || title.includes('bomb')) {
            return EventCategory.CONFLICT;
        }
        if (title.includes('earthquake') || title.includes('flood') || title.includes('storm')) {
            return EventCategory.NATURAL_DISASTER;
        }
        if (title.includes('protest') || title.includes('riot')) {
            return EventCategory.POLITICAL;
        }

        return EventCategory.CONFLICT; // Default for heavy news
    }

    private determineSeverity(article: GDELTArticle): Severity {
        const tone = article.tone || 0;
        const title = article.title?.toLowerCase() || '';

        if (tone < -10) return 'CRITICAL';
        if (title.includes('kill') && title.includes('massive')) return 'CRITICAL';

        if (tone < -5) return 'HIGH';
        if (title.includes('attack') || title.includes('dead')) return 'HIGH';

        return 'MEDIUM';
    }

    private parseDate(seendate: string): string {
        // GDELT date format: YYYYMMDDHHMMSS
        if (!seendate || seendate.length < 14) return new Date().toISOString();

        try {
            const year = seendate.substring(0, 4);
            const month = seendate.substring(4, 6);
            const day = seendate.substring(6, 8);
            const hour = seendate.substring(8, 10);
            const minute = seendate.substring(10, 12);
            const second = seendate.substring(12, 14);

            return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }

    private generateId(url: string): string {
        return url.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) || Math.random().toString(36).substr(2, 9);
    }
}
