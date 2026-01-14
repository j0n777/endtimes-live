
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import { getGeocodingService } from '../services/GeocodingService';
import Parser from 'rss-parser';

// High-value international news feeds
const NEWS_FEEDS = [
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?best-topics=world-at-work&post_type=best' }, // often tricky, using generic if fails
    { name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-en-all' },
    { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/' }
];

// Keywords to filter NOISE and keep INTELLIGENCE
const CRITICAL_KEYWORDS = [
    'war', 'conflict', 'military', 'attack', 'dead', 'killed', 'missile', 'nuclear',
    'invasion', 'coup', 'terror', 'bomb', 'explosion', 'cyber', 'hack', 'virus', 'outbreak',
    'earthquake', 'tsunami', 'volcano', 'storm', 'crisis', 'protest', 'riot'
];

export class NewsRSSCollector extends BaseCollector {
    private parser: Parser;
    private geocoder = getGeocodingService();

    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'NEWS_RSS',
            cacheDurationSeconds: 900, // 15 mins
            rateLimitPerMinute: 10,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 1800
        };
        super(config, supabase);
        this.parser = new Parser();
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const allEvents: MonitorEvent[] = [];

        for (const feed of NEWS_FEEDS) {
            try {
                // Check circuit breaker logic or simple try/catch
                const events = await this.fetchFeed(feed);
                allEvents.push(...events);
                // Pause slightly
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                console.warn(`[NewsRSS] Failed to fetch ${feed.name}:`, e);
            }
        }

        console.log(`📰 NewsRSS: Collected ${allEvents.length} relevant events from ${NEWS_FEEDS.length} sources`);
        return allEvents;
    }

    private async fetchFeed(feed: { name: string, url: string }): Promise<MonitorEvent[]> {
        const feedData = await this.parser.parseURL(feed.url);
        const events: MonitorEvent[] = [];

        for (const item of feedData.items.slice(0, 10)) {
            const title = item.title || '';
            const desc = item.contentSnippet || item.content || '';
            const text = `${title} ${desc}`;

            // 1. Keyword Filter
            if (!this.isRelevant(text)) continue;

            // 2. Classify
            const category = this.determineCategory(text);
            const severity = this.determineSeverity(text);

            // 3. Geocode (AI for High Severity)
            let location = 'Global';
            let coordinates = { lat: 0, lng: 0 };

            if (severity === 'CRITICAL' || severity === 'HIGH') {
                try {
                    const geoRes = await this.geocoder.geocode({ text: title, priority: 'high' });
                    if (geoRes.success && geoRes.location) {
                        location = geoRes.location.name;
                        coordinates = { lat: geoRes.location.lat, lng: geoRes.location.lng };
                    }
                } catch (e) { /* ignore */ }
            }

            events.push({
                id: `rss_${feed.name.replace(/\s/g, '')}_${item.guid || item.link}`,
                title: title,
                description: desc.substring(0, 500),
                category,
                severity,
                sourceType: 'RSS',
                sourceName: feed.name,
                sourceUrl: item.link || feed.url,
                timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                location,
                coordinates
            });
        }
        return events;
    }

    private isRelevant(text: string): boolean {
        const t = text.toLowerCase();
        return CRITICAL_KEYWORDS.some(k => t.includes(k));
    }

    private determineCategory(text: string): EventCategory {
        const t = text.toLowerCase();
        if (t.includes('war') || t.includes('military') || t.includes('army')) return EventCategory.CONFLICT;
        if (t.includes('protest') || t.includes('election')) return EventCategory.POLITICAL;
        if (t.includes('cyber')) return EventCategory.CYBER;
        if (t.includes('quake') || t.includes('storm')) return EventCategory.NATURAL_DISASTER;
        if (t.includes('virus')) return EventCategory.EPIDEMIC;
        return EventCategory.CONFLICT;
    }

    private determineSeverity(text: string): Severity {
        const t = text.toLowerCase();
        if (t.includes('nuclear') || t.includes('invasion') || t.includes('declared war')) return 'CRITICAL';
        if (t.includes('dead') || t.includes('killed') || t.includes('attack') || t.includes('crash')) return 'HIGH';
        return 'MEDIUM';
    }
}
