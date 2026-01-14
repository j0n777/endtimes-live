
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory } from '../../types';
import Parser from 'rss-parser';
import { getGeocodingService } from '../services/GeocodingService';

const parser = new Parser();

export class ChristianPersecutionCollector extends BaseCollector {
    // RSS Feeds for persecution news
    private feeds = [
        'https://news.google.com/rss/search?q=christian+persecution+attack+church&hl=en-US&gl=US&ceid=US:en',
        'https://www.persecution.org/feed/', // International Christian Concern
        'https://morningstarnews.org/feed/' // Morning Star News (Persecution specific)
    ];

    private geocoder = getGeocodingService();

    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'CHRISTIAN_PERSECUTION',
            cacheDurationSeconds: 3600, // 1 hour
            rateLimitPerMinute: 10,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 1800
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        console.log('✝️ Fetching Christian Persecution Intelligence...');
        const events: MonitorEvent[] = [];
        const seenTitles = new Set<string>();

        // Process feeds in parallel
        await Promise.all(this.feeds.map(async (url) => {
            try {
                const feed = await parser.parseURL(url);
                for (const item of feed.items || []) {
                    if (!item.title || seenTitles.has(item.title)) continue;
                    seenTitles.add(item.title);

                    // Skip old news (> 7 days)
                    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
                    const ageDays = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (ageDays > 7) continue;

                    // Classify Severity
                    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
                    const content = (item.title + ' ' + (item.contentSnippet || '')).toLowerCase();

                    if (content.includes('kill') || content.includes('murder') || content.includes('dead') || content.includes('massacre') || content.includes('burn')) {
                        severity = 'CRITICAL';
                    } else if (content.includes('arrest') || content.includes('prison') || content.includes('attack')) {
                        severity = 'HIGH';
                    }

                    // Attempt basic location extraction from title
                    // This is handled by storeEvents auto-geocoding, but we can hint it
                    let location = 'Global';
                    // Simple heuristic for major persecution countries
                    if (content.includes('nigeria')) location = 'Nigeria';
                    else if (content.includes('china')) location = 'China';
                    else if (content.includes('north korea')) location = 'North Korea';
                    else if (content.includes('pakistan')) location = 'Pakistan';
                    else if (content.includes('india')) location = 'India';
                    else if (content.includes('iran')) location = 'Iran';

                    events.push({
                        id: `persecution_${Math.random().toString(36).substr(2, 9)}`,
                        title: item.title,
                        description: item.contentSnippet?.substring(0, 300) || '',
                        category: EventCategory.PERSECUTION,
                        severity: severity,
                        sourceType: 'RSS',
                        sourceName: feed.title || 'Persecution Watch',
                        sourceUrl: item.link || '',
                        timestamp: pubDate.toISOString(),
                        location: location,
                        coordinates: { lat: 0, lng: 0 } // Let BaseCollector auto-geocode handle this
                    });
                }
            } catch (err) {
                console.warn(`Failed to fetch RSS ${url}: ${(err as Error).message}`);
            }
        }));

        console.log(`✝️ Found ${events.length} persecution events.`);
        return events;
    }
}
