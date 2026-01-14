
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import { getGeocodingService } from '../services/GeocodingService';
import Parser from 'rss-parser';

const MARITIME_RSS_URL = 'https://gcaptain.com/feed/';

export class MaritimeCollector extends BaseCollector {
    private parser: Parser;
    private geocoder = getGeocodingService();

    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'MARITIME_NEWS',
            cacheDurationSeconds: 3600, // 1 hour
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
            const feed = await this.parser.parseURL(MARITIME_RSS_URL);
            const events: MonitorEvent[] = [];

            for (const item of feed.items.slice(0, 15)) {
                if (!item.title || !item.link) continue;

                // Filter for relevant maritime incidents?
                // gCaptain has general news too.
                // We prioritize "Accident", "Fire", "Sink", "Attack", "Pirates"

                const severity = this.determineSeverity(item.title, item.contentSnippet || '');
                // If severity is LOW (Medium), we might still include it but maybe map visualization will filter it?
                // User asked for "Maritime Data".

                const category = EventCategory.MARITIME;

                let coordinates = { lat: 0, lng: 0 };
                let location = 'Global';

                if (severity === 'HIGH' || severity === 'CRITICAL') {
                    // Try to geocode
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
                    id: `gcaptain_${item.guid || item.link}`,
                    title: item.title,
                    description: item.contentSnippet || item.content || 'Maritime news.',
                    category,
                    severity,
                    sourceType: 'RSS',
                    sourceName: 'gCaptain',
                    sourceUrl: item.link,
                    timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                    location,
                    coordinates
                });
            }

            console.log(`⚓ MaritimeNews: Collected ${events.length} events`);
            return events;

        } catch (error) {
            throw new Error(`Failed to fetch Maritime News: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private determineSeverity(title: string, desc: string): Severity {
        const text = (title + ' ' + desc).toLowerCase();

        if (text.includes('sinking') || text.includes('sunk') || text.includes('fatal')) return 'CRITICAL';
        if (text.includes('pirate') || text.includes('attack') || text.includes('missile') || text.includes('houthis')) return 'CRITICAL';

        if (text.includes('fire') || text.includes('collision') || text.includes('aground')) return 'HIGH';

        if (text.includes('incident') || text.includes('rescue')) return 'ELEVATED';

        return 'MEDIUM';
    }
}
