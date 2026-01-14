
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import { getGeocodingService } from '../services/GeocodingService';
import Parser from 'rss-parser';

const AVIATION_RSS_URL = 'http://avherald.com/h?opt=0&task=rss';

export class AviationCollector extends BaseCollector {
    private parser: Parser;
    private geocoder = getGeocodingService();

    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'AVIATION_HERALD',
            cacheDurationSeconds: 1800, // 30 mins
            rateLimitPerMinute: 5,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 3600
        };
        super(config, supabase);
        this.parser = new Parser();
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        try {
            const feed = await this.parser.parseURL(AVIATION_RSS_URL);
            const events: MonitorEvent[] = [];

            // Aviation Herald RSS is simple: Title, Link, Description
            // We need to parse Title for Severity (Crash vs Incident)

            for (const item of feed.items.slice(0, 15)) { // Top 15
                if (!item.title || !item.link) continue;

                const severity = this.determineSeverity(item.title, item.contentSnippet || '');
                const category = EventCategory.AVIATION;

                // Geocoding
                // Titles usually: "Incident: Airline A320 at London on Jan 1st..."
                // or "Accident: ..."
                // Extract location might need AI or smart parsing
                // For now, use title as text for Geocoder (Simulated or Real)

                let coordinates = { lat: 0, lng: 0 };
                let location = 'Global';

                if (severity === 'HIGH' || severity === 'CRITICAL') {
                    // Use AI Geocoding for major crashes
                    const geoReq = { text: item.title, priority: 'high' as const };
                    try {
                        const geoRes = await this.geocoder.geocode(geoReq);
                        if (geoRes.success && geoRes.location) {
                            coordinates = { lat: geoRes.location.lat, lng: geoRes.location.lng };
                            location = geoRes.location.name;
                        }
                    } catch (e) { /* ignore */ }
                }

                events.push({
                    id: `avherald_${item.guid || item.link}`,
                    title: item.title,
                    description: item.contentSnippet || item.content || 'Aviation incident reported.',
                    category,
                    severity,
                    sourceType: 'RSS',
                    sourceName: 'The Aviation Herald',
                    sourceUrl: item.link,
                    timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                    location,
                    coordinates
                });
            }

            console.log(`✈️ AviationHerald: Collected ${events.length} events`);
            return events;

        } catch (error) {
            throw new Error(`Failed to fetch Aviation Herald: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private determineSeverity(title: string, desc: string): Severity {
        const text = (title + ' ' + desc).toLowerCase();

        if (text.includes('crash') || text.includes('accident') || text.includes('hull loss')) {
            if (text.includes('fatal') || text.includes('death')) return 'CRITICAL';
            return 'HIGH';
        }

        if (text.includes('hijack') || text.includes('shoot down') || text.includes('missile')) {
            return 'CRITICAL';
        }

        if (text.includes('incident') || text.includes('emergency')) {
            return 'ELEVATED';
        }

        return 'MEDIUM';
    }
}
