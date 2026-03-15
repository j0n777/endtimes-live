
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import { resolveLocation } from '../services/LocationResolver';
import { getGeocodingService } from '../services/GeocodingService';
import Parser from 'rss-parser';

interface MaritimeFeed {
    url: string;
    name: string;
    /** If set, only include articles containing at least one of these keywords */
    filterKeywords?: string[];
}

// Maritime & naval news sources — all free RSS feeds, no API key required
const MARITIME_FEEDS: MaritimeFeed[] = [
    {
        url: 'https://gcaptain.com/feed/',
        name: 'gCaptain',
    },
    {
        url: 'https://news.usni.org/feed',
        name: 'USNI News',
        filterKeywords: ['navy', 'naval', 'warship', 'destroyer', 'frigate', 'carrier', 'submarine',
            'fleet', 'ship', 'vessel', 'missile', 'strike', 'patrol', 'escort',
            'exercis', 'deploy', 'attack', 'fire', 'sunk', 'sink', 'torpedo'],
    },
    {
        url: 'https://www.navalnews.com/feed/',
        name: 'Naval News',
        filterKeywords: ['warship', 'destroyer', 'frigate', 'carrier', 'submarine', 'navy', 'naval',
            'fleet', 'vessel', 'commissioning', 'launch', 'missile', 'exercise', 'deploy'],
    },
    {
        url: 'https://navaltoday.com/feed/',
        name: 'NavalToday',
        filterKeywords: ['warship', 'navy', 'naval', 'ship', 'vessel', 'submarine', 'carrier',
            'frigate', 'destroyer', 'exercise', 'deploy', 'commission', 'launch'],
    },
];

export class MaritimeCollector extends BaseCollector {
    private parser: Parser;
    private geocoder = getGeocodingService();

    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'MARITIME_NEWS',
            cacheDurationSeconds: 3600, // 1 hour
            rateLimitPerMinute: 10,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 3600
        };
        super(config, supabase);
        this.parser = new Parser({ timeout: 15000 });
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const allEvents: MonitorEvent[] = [];

        for (const feed of MARITIME_FEEDS) {
            try {
                const parsedFeed = await this.parser.parseURL(feed.url);

                for (const item of parsedFeed.items.slice(0, 15)) {
                    if (!item.title || !item.link) continue;

                    const titleText = item.title.toLowerCase();
                    const descText = (item.contentSnippet || item.content || '').toLowerCase();

                    // Apply keyword filter if set
                    if (feed.filterKeywords && feed.filterKeywords.length > 0) {
                        const combined = titleText + ' ' + descText;
                        const hasKeyword = feed.filterKeywords.some(kw => combined.includes(kw));
                        if (!hasKeyword) continue;
                    }

                    const severity = this.determineSeverity(item.title, item.contentSnippet || '');
                    const category = EventCategory.MARITIME;

                    let coordinates = { lat: 0, lng: 0 };
                    let location = 'International Waters';

                    // Try keyword resolver first
                    const resolved = resolveLocation(item.title, item.contentSnippet || '', feed.name);
                    if (resolved) {
                        coordinates = resolved.coords;
                        location = resolved.name;
                    } else if (severity === 'HIGH' || severity === 'CRITICAL') {
                        // Fall back to AI geocoder only for high severity
                        try {
                            const geoRes = await this.geocoder.geocode({ text: item.title, priority: 'high' });
                            if (geoRes.success && geoRes.location) {
                                coordinates = { lat: geoRes.location.lat, lng: geoRes.location.lng };
                                location = geoRes.location.city || geoRes.location.address || geoRes.location.country || 'International Waters';
                            }
                        } catch { /* keep default */ }
                    }

                    const eventId = `maritime_${feed.name.toLowerCase().replace(/\s+/g, '_')}_${item.guid || item.link}`;

                    allEvents.push({
                        id: eventId,
                        title: item.title,
                        description: item.contentSnippet || item.content || '',
                        category,
                        severity,
                        sourceType: 'RSS',
                        sourceName: feed.name,
                        sourceUrl: item.link,
                        timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                        location,
                        coordinates
                    });
                }

            } catch (error) {
                // Log but don't throw — other feeds should still be attempted
                console.warn(`⚓ MaritimeFeed [${feed.name}] error: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Deduplicate by title similarity (keep first occurrence)
        const seen = new Set<string>();
        const deduped = allEvents.filter(e => {
            const key = e.title.toLowerCase().slice(0, 60);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        console.log(`⚓ MaritimeNews: Collected ${deduped.length} events from ${MARITIME_FEEDS.length} feeds`);
        return deduped;
    }

    private determineSeverity(title: string, desc: string): Severity {
        const text = (title + ' ' + desc).toLowerCase();

        if (text.includes('sinking') || text.includes('sunk') || text.includes('fatal')) return 'CRITICAL';
        if (text.includes('pirate') || text.includes('attack') || text.includes('missile') ||
            text.includes('houthis') || text.includes('torpedo') || text.includes('strike')) return 'CRITICAL';

        if (text.includes('fire') || text.includes('collision') || text.includes('aground') ||
            text.includes('exercise') || text.includes('deploy')) return 'HIGH';

        if (text.includes('incident') || text.includes('rescue') || text.includes('launch') ||
            text.includes('commission')) return 'ELEVATED';

        return 'MEDIUM';
    }
}
