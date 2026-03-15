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
    'earthcam':          { namePrefix: 'EarthCam' },
    'earthtv':           { namePrefix: 'EarthTV' },
    'inquizex':          { namePrefix: 'Inquizex OSINT' },
    'intelcamslive':     { namePrefix: 'IntelCams OSINT' },
    'aljazeera':         { namePrefix: 'Al Jazeera' },
    'aljazeeraenglish':  { namePrefix: 'Al Jazeera EN' },
    'france24english':   { namePrefix: 'France 24' },
    'dwnews':            { namePrefix: 'DW News' },
    'trtworld':          { namePrefix: 'TRT World' },
    'ruptly':            { namePrefix: 'Ruptly' },
    'wion':              { namePrefix: 'WION' },
    'i24newsenglish':    { namePrefix: 'i24 NEWS' },
    'cgtn':              { namePrefix: 'CGTN' },
    'skynewsarabia':     { namePrefix: 'Sky News Arabia' },
    'skyworldnews':      { namePrefix: 'Sky World News' },
};

// Geocoding dictionary for stream titles — keyword → coordinates
const GEO_DICTIONARY: Record<string, { lat: number, lng: number, location: string }> = {
    // --- Ukraine / Eastern Europe ---
    'kyiv':        { lat: 50.4501, lng: 30.5234,  location: 'Kyiv, Ukraine' },
    'kiev':        { lat: 50.4501, lng: 30.5234,  location: 'Kyiv, Ukraine' },
    'ukraine':     { lat: 49.0139, lng: 31.2858,  location: 'Ukraine' },
    'kharkiv':     { lat: 49.9935, lng: 36.2304,  location: 'Kharkiv, Ukraine' },
    'zaporizhzhia':{ lat: 47.8388, lng: 35.1396,  location: 'Zaporizhzhia, Ukraine' },
    'odessa':      { lat: 46.4825, lng: 30.7233,  location: 'Odessa, Ukraine' },
    'moldova':     { lat: 47.0105, lng: 28.8638,  location: 'Moldova' },
    // --- Middle East ---
    'tehran':      { lat: 35.6892, lng: 51.3890,  location: 'Tehran, Iran' },
    'iran':        { lat: 35.6892, lng: 51.3890,  location: 'Iran' },
    'tel aviv':    { lat: 32.0853, lng: 34.7818,  location: 'Tel Aviv, Israel' },
    'jerusalem':   { lat: 31.7767, lng: 35.2345,  location: 'Jerusalem' },
    'israel':      { lat: 31.5000, lng: 34.9000,  location: 'Israel' },
    'gaza':        { lat: 31.5017, lng: 34.4668,  location: 'Gaza Strip' },
    'west bank':   { lat: 31.9522, lng: 35.2332,  location: 'West Bank' },
    'beirut':      { lat: 33.8938, lng: 35.5018,  location: 'Beirut, Lebanon' },
    'lebanon':     { lat: 33.8938, lng: 35.5018,  location: 'Lebanon' },
    'damascus':    { lat: 33.5138, lng: 36.2765,  location: 'Damascus, Syria' },
    'aleppo':      { lat: 36.2021, lng: 37.1343,  location: 'Aleppo, Syria' },
    'syria':       { lat: 34.8021, lng: 38.9968,  location: 'Syria' },
    'baghdad':     { lat: 33.3152, lng: 44.3661,  location: 'Baghdad, Iraq' },
    'iraq':        { lat: 33.2232, lng: 43.6793,  location: 'Iraq' },
    'mosul':       { lat: 36.3350, lng: 43.1189,  location: 'Mosul, Iraq' },
    'kabul':       { lat: 34.5553, lng: 69.2075,  location: 'Kabul, Afghanistan' },
    'doha':        { lat: 25.2854, lng: 51.5310,  location: 'Doha, Qatar' },
    'qatar':       { lat: 25.3548, lng: 51.1839,  location: 'Qatar' },
    'riyadh':      { lat: 24.6877, lng: 46.7219,  location: 'Riyadh, Saudi Arabia' },
    'saudi':       { lat: 23.8859, lng: 45.0792,  location: 'Saudi Arabia' },
    'dubai':       { lat: 25.2048, lng: 55.2708,  location: 'Dubai, UAE' },
    'abu dhabi':   { lat: 24.4539, lng: 54.3773,  location: 'Abu Dhabi, UAE' },
    'uae':         { lat: 23.4241, lng: 53.8478,  location: 'UAE' },
    'amman':       { lat: 31.9539, lng: 35.9106,  location: 'Amman, Jordan' },
    'jordan':      { lat: 30.5852, lng: 36.2384,  location: 'Jordan' },
    'cairo':       { lat: 30.0444, lng: 31.2357,  location: 'Cairo, Egypt' },
    'egypt':       { lat: 26.8206, lng: 30.8025,  location: 'Egypt' },
    'sanaa':       { lat: 15.3694, lng: 44.1910,  location: "Sana'a, Yemen" },
    'yemen':       { lat: 15.5527, lng: 48.5164,  location: 'Yemen' },
    'khartoum':    { lat: 15.5007, lng: 32.5599,  location: 'Khartoum, Sudan' },
    'sudan':       { lat: 12.8628, lng: 30.2176,  location: 'Sudan' },
    'tripoli':     { lat: 32.8872, lng: 13.1913,  location: 'Tripoli, Libya' },
    'libya':       { lat: 26.3351, lng: 17.2283,  location: 'Libya' },
    // --- Russia / Central Asia ---
    'moscow':      { lat: 55.7539, lng: 37.6208,  location: 'Moscow, Russia' },
    'russia':      { lat: 61.5240, lng: 105.3188, location: 'Russia' },
    'st. petersburg': { lat: 59.9343, lng: 30.3351, location: 'St. Petersburg, Russia' },
    'minsk':       { lat: 53.9006, lng: 27.5590,  location: 'Minsk, Belarus' },
    'almaty':      { lat: 43.2220, lng: 76.8512,  location: 'Almaty, Kazakhstan' },
    'tashkent':    { lat: 41.2995, lng: 69.2401,  location: 'Tashkent, Uzbekistan' },
    // --- Asia-Pacific ---
    'beijing':     { lat: 39.9042, lng: 116.4074, location: 'Beijing, China' },
    'shanghai':    { lat: 31.2304, lng: 121.4737, location: 'Shanghai, China' },
    'china':       { lat: 35.8617, lng: 104.1954, location: 'China' },
    'taiwan':      { lat: 23.6978, lng: 120.9605, location: 'Taiwan' },
    'taipei':      { lat: 25.0330, lng: 121.5654, location: 'Taipei, Taiwan' },
    'hong kong':   { lat: 22.3193, lng: 114.1694, location: 'Hong Kong' },
    'tokyo':       { lat: 35.6762, lng: 139.6503, location: 'Tokyo, Japan' },
    'japan':       { lat: 36.2048, lng: 138.2529, location: 'Japan' },
    'seoul':       { lat: 37.5665, lng: 126.9780, location: 'Seoul, South Korea' },
    'korea':       { lat: 37.5665, lng: 126.9780, location: 'Seoul, South Korea' },
    'pyongyang':   { lat: 39.0392, lng: 125.7625, location: 'Pyongyang, North Korea' },
    'north korea': { lat: 40.3399, lng: 127.5101, location: 'North Korea' },
    'singapore':   { lat: 1.3521,  lng: 103.8198, location: 'Singapore' },
    'jakarta':     { lat: -6.2088, lng: 106.8456, location: 'Jakarta, Indonesia' },
    'manila':      { lat: 14.5995, lng: 120.9842, location: 'Manila, Philippines' },
    'bangkok':     { lat: 13.7563, lng: 100.5018, location: 'Bangkok, Thailand' },
    'hanoi':       { lat: 21.0285, lng: 105.8542, location: 'Hanoi, Vietnam' },
    'mumbai':      { lat: 19.0760, lng: 72.8777,  location: 'Mumbai, India' },
    'delhi':       { lat: 28.6139, lng: 77.2090,  location: 'New Delhi, India' },
    'india':       { lat: 20.5937, lng: 78.9629,  location: 'India' },
    'pakistan':    { lat: 30.3753, lng: 69.3451,  location: 'Pakistan' },
    'islamabad':   { lat: 33.6844, lng: 73.0479,  location: 'Islamabad, Pakistan' },
    'karachi':     { lat: 24.8607, lng: 67.0011,  location: 'Karachi, Pakistan' },
    'sydney':      { lat: -33.8688, lng: 151.2093, location: 'Sydney, Australia' },
    'australia':   { lat: -25.2744, lng: 133.7751, location: 'Australia' },
    // --- Europe ---
    'london':      { lat: 51.5072, lng: -0.1276,  location: 'London, UK' },
    'paris':       { lat: 48.8566, lng: 2.3522,   location: 'Paris, France' },
    'berlin':      { lat: 52.5200, lng: 13.4050,  location: 'Berlin, Germany' },
    'madrid':      { lat: 40.4168, lng: -3.7038,  location: 'Madrid, Spain' },
    'rome':        { lat: 41.9028, lng: 12.4964,  location: 'Rome, Italy' },
    'warsaw':      { lat: 52.2297, lng: 21.0122,  location: 'Warsaw, Poland' },
    'istanbul':    { lat: 41.0082, lng: 28.9784,  location: 'Istanbul, Turkey' },
    'ankara':      { lat: 39.9334, lng: 32.8597,  location: 'Ankara, Turkey' },
    'athens':      { lat: 37.9838, lng: 23.7275,  location: 'Athens, Greece' },
    // --- Americas ---
    'new york':    { lat: 40.7128, lng: -74.0060, location: 'New York, USA' },
    'times square':{ lat: 40.7580, lng: -73.9855, location: 'Times Square, New York' },
    'washington':  { lat: 38.9072, lng: -77.0369, location: 'Washington DC, USA' },
    'chicago':     { lat: 41.8781, lng: -87.6298, location: 'Chicago, USA' },
    'los angeles': { lat: 34.0522, lng: -118.2437, location: 'Los Angeles, USA' },
    'miami':       { lat: 25.7617, lng: -80.1918, location: 'Miami, USA' },
    'las vegas':   { lat: 36.1699, lng: -115.1398, location: 'Las Vegas, USA' },
    'mexico city': { lat: 19.4326, lng: -99.1332, location: 'Mexico City, Mexico' },
    'bogota':      { lat: 4.7110,  lng: -74.0721, location: 'Bogotá, Colombia' },
    'caracas':     { lat: 10.4806, lng: -66.9036, location: 'Caracas, Venezuela' },
    // --- Africa ---
    'nairobi':     { lat: -1.2921, lng: 36.8219,  location: 'Nairobi, Kenya' },
    'addis ababa': { lat: 9.0320,  lng: 38.7469,  location: 'Addis Ababa, Ethiopia' },
    'ethiopia':    { lat: 9.1450,  lng: 40.4897,  location: 'Ethiopia' },
    'lagos':       { lat: 6.5244,  lng: 3.3792,   location: 'Lagos, Nigeria' },
    'nigeria':     { lat: 9.0820,  lng: 8.6753,   location: 'Nigeria' },
    'somalia':     { lat: 5.1521,  lng: 46.1996,  location: 'Somalia' },
    'mogadishu':   { lat: 2.0469,  lng: 45.3182,  location: 'Mogadishu, Somalia' },
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

        // Live cam networks + 24/7 news channels (always live, conflict-zone focus)
        this.targetHandles = targetHandles || [
            // Urban / webcam networks
            'earthcam', 'earthTV', 'SkylinkHQ',
            // OSINT conflict cams
            'Inquizex', 'intelcamslive',
            // Middle East & Global News (24/7 streams — provide location context)
            'AlJazeeraEnglish', 'france24english', 'DWNews', 'TRTWorld',
            'i24newsenglish', 'ruptly', 'wion', 'skynewsarabia',
        ];
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
            if (lowerTitle.includes('qatar')) return GEO_DICTIONARY['doha'];
        }

        // News channels: map to their primary bureau/focus location when title is too generic
        if (handle.toLowerCase() === 'aljazeeraenglish' || handle.toLowerCase() === 'aljazeera') {
            if (lowerTitle.includes('live')) return GEO_DICTIONARY['doha'];
        }
        if (handle.toLowerCase() === 'i24newsenglish') {
            if (lowerTitle.includes('live')) return GEO_DICTIONARY['tel aviv'];
        }
        if (handle.toLowerCase() === 'trtworld') {
            if (lowerTitle.includes('live')) return GEO_DICTIONARY['istanbul'];
        }
        if (handle.toLowerCase() === 'skynewsarabia') {
            if (lowerTitle.includes('live')) return GEO_DICTIONARY['dubai'];
        }
        if (handle.toLowerCase() === 'wion') {
            if (lowerTitle.includes('live')) return GEO_DICTIONARY['delhi'];
        }
        if (handle.toLowerCase() === 'ruptly') {
            // Ruptly covers Europe & conflict zones
            if (lowerTitle.includes('live')) return GEO_DICTIONARY['moscow'];
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
