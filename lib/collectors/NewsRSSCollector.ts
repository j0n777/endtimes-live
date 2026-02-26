
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import { getGeocodingService } from '../services/GeocodingService';
import { extractStaticLocation } from '../services/StaticLocationService';
import Parser from 'rss-parser';

// Comprehensive Intelligence Feeds (3+ per Continent)
const NEWS_FEEDS = [
    // --- NORTH AMERICA ---
    { name: 'NY Times World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
    { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss' },
    { name: 'Washington Post', url: 'https://feeds.washingtonpost.com/rss/world' },
    { name: 'Global News CA', url: 'https://globalnews.ca/feed/' },

    // --- SOUTH AMERICA ---
    { name: 'MercoPress', url: 'https://en.mercopress.com/rss' }, // LatAm General
    { name: 'Buenos Aires Times', url: 'https://www.batimes.com.ar/feed' },
    { name: 'Folha de S.Paulo', url: 'https://feeds.folha.uol.com.br/emcima/rss091.xml' }, // Portuguese (will need translation or keywording)

    // --- EUROPE ---
    { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'France 24', url: 'https://www.france24.com/en/rss' },
    { name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-en-all' },
    { name: 'Kyiv Independent', url: 'https://kyivindependent.com/feed' }, // Ukraine Focus

    // --- ASIA ---
    { name: 'Channel News Asia', url: 'https://www.channelnewsasia.com/api/v1/rss-feeds/rss-feed-1.xml' }, // Singapore/SE Asia
    { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms' },
    { name: 'SCMP', url: 'https://www.scmp.com/rss/91/feed' }, // Hong Kong/China
    { name: 'NHK World', url: 'https://www3.nhk.or.jp/nhkworld/en/news/list/feed.xml' }, // Japan

    // --- MIDDLE EAST ---
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'Jerusalem Post', url: 'https://www.jpost.com/rss/rssfeedsheadlines.aspx' },
    { name: 'Arab News', url: 'https://www.arabnews.com/cat/2/rss.xml' },

    // --- AFRICA ---
    { name: 'AllAfrica', url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf' },
    { name: 'News24 SA', url: 'http://feeds.news24.com/articles/news24/TopStories/rss' },
    { name: 'The Star Kenya', url: 'https://www.the-star.co.ke/rss' },

    // --- OCEANIA ---
    { name: 'ABC News AU', url: 'https://www.abc.net.au/news/feed/52496/rss.xml' },
    { name: 'NZ Herald', url: 'https://www.nzherald.co.nz/arc/outboundfeeds/rss/section/world/?outputType=xml' },

    // --- DEFENSE/SPECIAL ---
    { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/' },
    { name: 'The Aviationist', url: 'https://theaviationist.com/feed/' }
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
            cacheDurationSeconds: 120, // 2 mins (Near Real-time)
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

            // 3. Geocode
            // STRATEGY: Try Static Extraction -> AI (if Critical) -> Global (fallback)
            let location = 'Global';

            // Default to Mid-Atlantic to ensure visibility even if Global (better than Null Island)
            let coordinates = { lat: 25.0, lng: -40.0 };

            const staticLoc = extractStaticLocation(text);

            if (staticLoc) {
                location = staticLoc.name;
                coordinates = staticLoc.coords;
            } else if (severity === 'CRITICAL' || severity === 'HIGH') {
                // Only use AI for critical items that weren't found statically
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
