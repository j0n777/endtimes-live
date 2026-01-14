import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

const ACLED_BASE_URL = 'https://api.acleddata.com/acled/read';

interface ACLEDEvent {
    event_id_cnty: string;
    event_date: string;
    event_type: string;
    sub_event_type: string;
    actor1: string;
    fatalities: number;
    location: string;
    country: string;
    latitude: number;
    longitude: number;
    notes: string;
    source: string;
}

/**
 * ACLED Collector - CRITICAL: 3000 requests/year limit!
 * This collector has the strictest rate limiting of all data sources
 */
export class ACLEDCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'ACLED',
            cacheDurationSeconds: 86400, // 24 HOURS - MANDATORY for quota protection
            rateLimitPerMinute: 1,
            rateLimitPerDay: 8,
            rateLimitPerYear: 3000, // CRITICAL LIMIT
            maxRetries: 2, // Fewer retries to save quota
            circuitBreakerThreshold: 3,
            circuitBreakerTimeout: 7200 // 2 hours
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const apiKey = process.env.ACLED_API_KEY || process.env.VITE_ACLED_API_KEY;
        const email = process.env.ACLED_EMAIL || process.env.VITE_ACLED_EMAIL;

        if (!apiKey || !email) {
            throw new Error('ACLED requires API_KEY and EMAIL in .env file');
        }

        // Fetch last 7 days of data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        const params = new URLSearchParams({
            key: apiKey,
            email: email,
            event_date: `${this.formatDate(startDate)}|${this.formatDate(endDate)}`,
            event_date_where: 'BETWEEN',
            limit: '500' // Max results per request
        });

        const response = await fetch(`${ACLED_BASE_URL}?${params}`);

        if (!response.ok) {
            throw new Error(`ACLED API error: ${response.status}`);
        }

        const result = await response.json();
        const events: ACLEDEvent[] = result.data || [];

        console.log(`⚔️ ACLED: Received ${events.length} conflict events`);

        // Filter to only significant events (fatalities > 0 or violence events)
        const filtered = events.filter(event =>
            event.fatalities > 0 ||
            event.event_type.includes('Violence') ||
            event.event_type.includes('Battles') ||
            event.event_type.includes('Explosions')
        );

        console.log(`⚔️ ACLED: Filtered to ${filtered.length} significant events`);

        // Limit to top 50 most severe
        const limited = filtered
            .sort((a, b) => b.fatalities - a.fatalities)
            .slice(0, 50);

        return limited.map(event => ({
            id: event.event_id_cnty,
            title: `${event.event_type}: ${event.sub_event_type}`,
            description: `${event.notes.substring(0, 300)}${event.notes.length > 300 ? '...' : ''}`,
            category: EventCategory.CONFLICT,
            severity: this.determineSeverity(event.fatalities, event.event_type),
            sourceType: 'OFFICIAL' as const,
            sourceName: 'ACLED',
            location: `${event.location}, ${event.country}`,
            coordinates: {
                lat: event.latitude,
                lng: event.longitude,
            },
            timestamp: new Date(event.event_date).toISOString(),
            sourceUrl: `https://acleddata.com/`,
            conflictLevel: event.fatalities > 0 ? `${event.fatalities} fatalities` : undefined,
        }));
    }

    private determineSeverity(fatalities: number, eventType: string): Severity {
        if (fatalities >= 50) return 'HIGH';
        if (fatalities >= 10) return 'ELEVATED';
        if (fatalities > 0) return 'MEDIUM';

        if (eventType.includes('Violence against civilians')) return 'ELEVATED';
        if (eventType.includes('Battles')) return 'MEDIUM';

        return 'MEDIUM';
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
}
