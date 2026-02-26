import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity, SourceType } from '../../types';
import { getGeocodingService } from '../services/GeocodingService';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface LiveCamResult {
    id: string;
    title: string;
    videoId: string;
    channelHandle: string;
}

// Map channel handles to their standard location/names if not easily parsed from title
const CHANNEL_DEFAULTS: Record<string, { namePrefix: string }> = {
    'earthcam': { namePrefix: 'EarthCam' },
    'earthtv': { namePrefix: 'EarthTV' },
    'inquizex': { namePrefix: 'Inquizex OSINT' },
    'intelcamslive': { namePrefix: 'IntelCams OSINT' }
};

// Simple Geocoding dictionary for stream titles
// Real geocoding APIs cost money or rate limit, so for OSINT streams we use keyword matching
const GEO_DICTIONARY: Record<string, { lat: number, lng: number, location: string }> = {
    'kyiv': { lat: 50.4501, lng: 30.5234, location: 'Kyiv, Ukraine' },
    'kiev': { lat: 50.4501, lng: 30.5234, location: 'Kyiv, Ukraine' },
    'tehran': { lat: 35.6892, lng: 51.3890, location: 'Tehran, Iran' },
    'iran': { lat: 35.6892, lng: 51.3890, location: 'Iran (General)' },
    'tel aviv': { lat: 32.0853, lng: 34.7818, location: 'Tel Aviv, Israel' },
    'jerusalem': { lat: 31.7767, lng: 35.2345, location: 'Jerusalem, Israel' },
    'gaza': { lat: 31.5017, lng: 34.4668, location: 'Gaza Strip' },
    'moscow': { lat: 55.7539, lng: 37.6208, location: 'Moscow, Russia' },
    'new york': { lat: 40.7580, lng: -73.9855, location: 'New York, USA' },
    'times square': { lat: 40.7580, lng: -73.9855, location: 'New York, USA' },
    'taipei': { lat: 25.0330, lng: 121.5654, location: 'Taipei, Taiwan' },
    'cairo': { lat: 30.0444, lng: 31.2357, location: 'Cairo, Egypt' },
    'beirut': { lat: 33.8938, lng: 35.5018, location: 'Beirut, Lebanon' },
    'lebanon': { lat: 33.8938, lng: 35.5018, location: 'Lebanon' },
    'london': { lat: 51.5072, lng: -0.1276, location: 'London, UK' },
    'paris': { lat: 48.8566, lng: 2.3522, location: 'Paris, France' },
    'tokyo': { lat: 35.6762, lng: 139.6503, location: 'Tokyo, Japan' },
    'las vegas': { lat: 36.1699, lng: -115.1398, location: 'Las Vegas, USA' },
    'miami': { lat: 25.7617, lng: -80.1918, location: 'Miami, USA' },
    'sydney': { lat: -33.8688, lng: 151.2093, location: 'Sydney, Australia' },
    'istanbul': { lat: 41.0082, lng: 28.9784, location: 'Istanbul, Turkey' },
    'seoul': { lat: 37.5665, lng: 126.9780, location: 'Seoul, South Korea' },
    'pyongyang': { lat: 39.0392, lng: 125.7625, location: 'Pyongyang, North Korea' },
    'korea': { lat: 37.5665, lng: 126.9780, location: 'Seoul, South Korea' },
    'beijing': { lat: 39.9042, lng: 116.4074, location: 'Beijing, China' },
    'taiwan': { lat: 23.6978, lng: 120.9605, location: 'Taiwan' },
    'japan': { lat: 35.6762, lng: 139.6503, location: 'Japan' }
};

export class YouTubeLiveCollector extends BaseCollector {
    private targetHandles: string[];
    private geocoder: any;

    constructor(supabase: SupabaseClient, targetHandles?: string[]) {
        const config: CollectorConfig = {
            name: 'YOUTUBE_LIVE_CAMS',
            cacheDurationSeconds: 600, // 10 minutes cache
            rateLimitPerMinute: 20,
            maxRetries: 1,
            circuitBreakerThreshold: 3,
            circuitBreakerTimeout: 300
        };
        super(config, supabase);
        this.geocoder = getGeocodingService();

        // We include major global live cam networks focusing on urban views and conflicts
        this.targetHandles = targetHandles || ['earthcam', 'earthTV', 'Inquizex', 'intelcamslive', 'SkylinkHQ'];
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const events: MonitorEvent[] = [];

        for (const handle of this.targetHandles) {
            try {
                console.log(`Scraping live streams for @${handle}`);

                // Note: We bypass normal API keys to use raw HTML scraping for cost efficiency.
                // Works perfectly for public /streams pages.
                const response = await fetch(`https://www.youtube.com/@${handle}/streams`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    signal: AbortSignal.timeout(10000)
                });

                if (!response.ok) {
                    console.log(`Failed to fetch @${handle}: ${response.status}`);
                    continue;
                }

                const html = await response.text();

                // Extract video IDs and titles using regex on ytInitialData
                // This is robust against DOM changes since it's the JSON payload
                const ytDataMatch = html.match(/(?:var ytInitialData = |window\["ytInitialData"\] = )({.+?});/);

                if (!ytDataMatch) {
                    console.log(`Could not find ytInitialData for @${handle}`);
                    continue;
                }

                try {
                    const data = JSON.parse(ytDataMatch[1]);
                    const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
                    if (!tabs) continue;

                    let streamsTab = tabs.find((t: any) => t.tabRenderer?.title?.toLowerCase() === 'live' || t.tabRenderer?.title?.toLowerCase() === 'ao vivo');

                    if (!streamsTab) continue;

                    const items = streamsTab.tabRenderer?.content?.richGridRenderer?.contents || [];

                    let count = 0;
                    for (const item of items) {
                        const videoRenderer = item.richItemRenderer?.content?.videoRenderer;
                        if (!videoRenderer) continue;

                        const videoId = videoRenderer.videoId;
                        const title = videoRenderer.title?.runs?.[0]?.text || '';
                        const isLive = videoRenderer.thumbnailOverlays?.some(
                            (overlay: any) => overlay.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE'
                        );

                        // We ONLY want currently active Live streams
                        if (videoId && title && isLive) {

                            // Map coordinates based on title keywords
                            let geoInfo = this.extractLocationFromTitle(title, handle);

                            // Dynamically Geocode if dictionary fails (e.g. EarthCam cities)
                            if (!geoInfo) {
                                try {
                                    // Use 'low' priority to force free Nominatim API and save AI credits
                                    const geoRes = await this.geocoder.geocode({ text: title, priority: 'low' });
                                    if (geoRes.success && geoRes.location) {
                                        geoInfo = {
                                            lat: geoRes.location.lat,
                                            lng: geoRes.location.lng,
                                            location: geoRes.location.city || geoRes.location.address || geoRes.location.country || 'Unknown'
                                        };
                                        console.log(`📡 Dynamically geocoded: ${title} -> ${geoInfo.location}`);
                                    }
                                } catch (e) {
                                    // ignore and skip if geocoding fails
                                }
                            }

                            if (geoInfo) {
                                count++;
                                const prefix = CHANNEL_DEFAULTS[handle.toLowerCase()]?.namePrefix || handle;

                                events.push({
                                    id: `cam_${videoId}`,
                                    title: `${prefix}: ${title}`,
                                    description: `Live tactical camera feed from ${geoInfo.location}. Source: @${handle}`,
                                    category: EventCategory.OTHER, // We will map these out on the frontend separately
                                    severity: 'LOW',
                                    sourceType: SourceType.OTHER,
                                    sourceName: 'YouTube Live',
                                    location: geoInfo.location,
                                    timestamp: new Date().toISOString(),
                                    coordinates: {
                                        lat: geoInfo.lat,
                                        lng: geoInfo.lng
                                    },
                                    url: `https://www.youtube.com/watch?v=${videoId}`,
                                    mediaUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`,
                                    tags: ['livecam', handle, 'osint']
                                });
                            }
                        }
                    }
                    console.log(`Extracted ${count} active mapped live cams from @${handle}`);
                } catch (e: any) {
                    console.log(`Error parsing JSON for @${handle}: ${e.message}`);
                }

            } catch (error: any) {
                console.log(`Error scraping @${handle}: ${error.message}`);
            }

            // Wait 2s between channels to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));
        }

        // ==========================================
        // LOCAL JSON EXPORT (Bypass Database)
        // ==========================================
        // We bypass the BaseCollector's default Supabase insert to avoid table bloat,
        // and instead dump it to a shared volume for the frontend to consume.
        try {
            // In Docker, we will map a local volume to /app/public/data
            const dir = path.join(process.cwd(), 'public', 'data');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const file = path.join(dir, 'cams.json');
            fs.writeFileSync(file, JSON.stringify(events, null, 2));
            console.log(`✅ Saved ${events.length} dynamic cameras to cams.json`);
        } catch (e: any) {
            console.log(`Failed to write cams.json: ${e.message}`);
        }

        // Return empty so BaseCollector doesn't insert these into the 'events' PostgreSQL table
        return [];
    }

    private extractLocationFromTitle(title: string, handle: string): { lat: number, lng: number, location: string } | null {
        const lowerTitle = title.toLowerCase();

        // Custom fallbacks based on the channel handle
        if (handle.toLowerCase() === 'inquizex') {
            // Inquizex has generic titles but is known to focus on Iran/Israel/Ukraine
            if (lowerTitle.includes('iran') && lowerTitle.includes('israel')) {
                return GEO_DICTIONARY['tehran']; // Default to Tehran for ME conflict feeds
            }
        }

        if (handle.toLowerCase() === 'intelcamslive') {
            if (lowerTitle.includes('lebanon') || lowerTitle.includes('beirut')) return GEO_DICTIONARY['beirut'];
            if (lowerTitle.includes('iran')) return GEO_DICTIONARY['tehran'];
            if (lowerTitle.includes('israel')) return GEO_DICTIONARY['tel aviv'];
            if (lowerTitle.includes('gaza')) return GEO_DICTIONARY['gaza'];
            if (lowerTitle.includes('qatar')) return GEO_DICTIONARY['cairo']; // Approximate general ME view if Doha missing
        }

        // Direct dictionary match
        for (const [key, value] of Object.entries(GEO_DICTIONARY)) {
            // Check for whole words to prevent "iran" matching "tirana"
            const regex = new RegExp(`\\b${key}\\b`, 'i');
            if (regex.test(title)) {
                return value;
            }
        }

        // If it's a known generic EarthCam feed without specific keywords, try fuzzy matching or skip
        return null;
    }
}
