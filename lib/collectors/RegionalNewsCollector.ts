
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import { getGeocodingService } from '../services/GeocodingService';
import { extractStaticLocation } from '../services/StaticLocationService';
import Parser from 'rss-parser';

export enum MonitorRegion {
    SOUTH_AMERICA = 'SOUTH_AMERICA',
    NORTH_AMERICA = 'NORTH_AMERICA',
    EUROPE = 'EUROPE',
    AFRICA = 'AFRICA',
    RUSSIA_ASIA = 'RUSSIA_ASIA',
    BRAZIL = 'BRAZIL' // Specific focus
}

// Feeds Configuration
const REGIONAL_FEEDS: Record<MonitorRegion, { name: string, url: string }[]> = {
    [MonitorRegion.BRAZIL]: [
        { name: 'Folha de S.Paulo (Mundo)', url: 'https://feeds.folha.uol.com.br/mundo/rss091.xml' },
        { name: 'Estadão (Internacional)', url: 'https://www.estadao.com.br/rss/internacional' },
        { name: 'G1 (Mundo)', url: 'https://g1.globo.com/rss/g1/mundo/' },
        { name: 'BBC Brasil', url: 'https://www.bbc.com/portuguese/index.xml' },
        { name: 'El País Brasil', url: 'https://brasil.elpais.com/rss/brasil/portada.xml' } // Backup/Check if active
    ],
    [MonitorRegion.SOUTH_AMERICA]: [
        { name: 'MercoPress', url: 'https://en.mercopress.com/rss' },
        { name: 'Buenos Aires Times', url: 'https://www.batimes.com.ar/feed' },
        { name: 'La Nación (Argentina)', url: 'http://servicios.lanacion.com.ar/herramientas/rss/origen=2' },
        { name: 'El Universal (Venezuela)', url: 'https://www.eluniversal.com/rss/' },
        { name: 'BioBioChile', url: 'https://www.biobiochile.cl/feed' }
    ],
    [MonitorRegion.EUROPE]: [
        { name: 'BBC World (Europe)', url: 'http://feeds.bbci.co.uk/news/world/europe/rss.xml' },
        { name: 'France 24', url: 'https://www.france24.com/en/rss' },
        { name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-en-all' },
        { name: 'Kyiv Independent', url: 'https://kyivindependent.com/feed' },
        { name: 'The Guardian (Europe)', url: 'https://www.theguardian.com/world/europe/rss' }
    ],
    [MonitorRegion.AFRICA]: [
        { name: 'AllAfrica', url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf' },
        { name: 'News24', url: 'http://feeds.news24.com/articles/news24/TopStories/rss' },
        { name: 'The Star (Kenya)', url: 'https://www.the-star.co.ke/rss' },
        { name: 'Premium Times (Nigeria)', url: 'https://www.premiumtimesng.com/feed' },
        { name: 'Al Jazeera (Africa)', url: 'https://www.aljazeera.com/xml/rss/all.xml' } // General but good coverage
    ],
    [MonitorRegion.RUSSIA_ASIA]: [
        { name: 'The Moscow Times', url: 'https://www.themoscowtimes.com/rss/news' },
        { name: 'TASS (English)', url: 'https://tass.com/rss' }, // Might be rate limited/blocked
        { name: 'RT (News)', url: 'https://www.rt.com/rss/news/' }, // Often blocked, robust failover needed
        { name: 'South China Morning Post', url: 'https://www.scmp.com/rss/91/feed' },
        { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms' }
    ],
    [MonitorRegion.NORTH_AMERICA]: [
        { name: 'NY Times (System)', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
        { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss' },
        { name: 'Washington Post', url: 'https://feeds.washingtonpost.com/rss/world' },
        { name: 'Global News CA', url: 'https://globalnews.ca/feed/' },
        { name: 'Fox News (World)', url: 'https://moxie.foxnews.com/google-publisher/world.xml' }
    ]
};

const CRITICAL_KEYWORDS = [
    'war', 'conflict', 'military', 'attack', 'dead', 'killed', 'missile', 'nuclear',
    'invasion', 'coup', 'terror', 'bomb', 'explosion', 'cyber', 'hack', 'virus', 'outbreak',
    'earthquake', 'tsunami', 'volcano', 'storm', 'crisis', 'protest', 'riot'
];

export class RegionalNewsCollector extends BaseCollector {
    private parser: Parser;
    private geocoder = getGeocodingService();
    private region: MonitorRegion;

    constructor(supabase: SupabaseClient, region: MonitorRegion) {
        const config: CollectorConfig = {
            name: `NEWS_${region}`,
            cacheDurationSeconds: 900, // 15 minutes
            rateLimitPerMinute: 10,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 1800
        };
        super(config, supabase);
        this.region = region;
        this.parser = new Parser();
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const allEvents: MonitorEvent[] = [];
        const feeds = REGIONAL_FEEDS[this.region];

        console.log(`🌍 [${this.region}] Starting collection from ${feeds.length} sources...`);

        for (const feed of feeds) {
            try {
                const events = await this.fetchFeed(feed);
                allEvents.push(...events);
                // Pause slightly
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                console.warn(`[${this.region}] Failed to fetch ${feed.name}:`, e);
            }
        }

        console.log(`✅ [${this.region}] Collected ${allEvents.length} relevant events`);
        return allEvents;
    }

    private async fetchFeed(feed: { name: string, url: string }): Promise<MonitorEvent[]> {
        try {
            const feedData = await this.parser.parseURL(feed.url);
            const events: MonitorEvent[] = [];

            // We take top 10 items per feed to avoid clutter,
            // but for specific regions we might want more depth? 
            // Stick to 10 for now.
            for (const item of feedData.items.slice(0, 10)) {
                const title = item.title || '';
                const desc = item.contentSnippet || item.content || '';
                const text = `${title} ${desc}`;

                // 1. Keyword Filter (Optional: can relax this for regional feeds if we want more coverage)
                // User said "points diverse... without clustering". 
                // We should keep filter to avoid purely political/sports noise.
                if (!this.isRelevant(text)) continue;

                // 2. Classify
                const category = this.determineCategory(text);
                const severity = this.determineSeverity(text);

                // 3. Geocode
                let location = 'Global';
                let coordinates = { lat: 0, lng: 0 };

                // Set default coordinates based on Region if geocoding fails?
                // Better than Null Island.
                const regionDefaults: Record<MonitorRegion, { lat: number, lng: number }> = {
                    [MonitorRegion.BRAZIL]: { lat: -14.2, lng: -51.9 },
                    [MonitorRegion.SOUTH_AMERICA]: { lat: -22.0, lng: -60.0 },
                    [MonitorRegion.EUROPE]: { lat: 48.0, lng: 12.0 },
                    [MonitorRegion.AFRICA]: { lat: 0.0, lng: 20.0 },
                    [MonitorRegion.RUSSIA_ASIA]: { lat: 45.0, lng: 80.0 },
                    [MonitorRegion.NORTH_AMERICA]: { lat: 40.0, lng: -100.0 }
                };

                const defaultCoords = regionDefaults[this.region];
                coordinates = defaultCoords;

                const staticLoc = extractStaticLocation(text);

                if (staticLoc) {
                    location = staticLoc.name;
                    coordinates = staticLoc.coords;
                } else {
                    // Use AI Geocoding for HIGH/CRITICAL, use free Nominatim for MEDIUM
                    try {
                        const pLevel = (severity === 'CRITICAL' || severity === 'HIGH') ? 'high' : 'low';
                        const geoRes = await this.geocoder.geocode({ text: text, priority: pLevel, context: { country: this.region.replace('_', ' ') } });
                        if (geoRes.success && geoRes.location) {
                            location = geoRes.location.city || geoRes.location.address || geoRes.location.name || geoRes.location.country;
                            coordinates = { lat: geoRes.location.lat, lng: geoRes.location.lng };
                        } else {
                            // Fallback Name if Nominatim fails
                            location = this.region.replace('_', ' '); // e.g. "SOUTH AMERICA"
                        }
                    } catch (e) {
                        location = this.region.replace('_', ' ');
                    }
                }

                events.push({
                    id: `rss_${this.region}_${feed.name.replace(/\s/g, '')}_${item.guid || item.link}`,
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
        } catch (error) {
            console.error(`Error parsing feed ${feed.url}:`, error);
            return [];
        }
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
