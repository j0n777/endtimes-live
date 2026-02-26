
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import { getGeocodingService } from '../services/GeocodingService';

// Priority channels for intelligence
const DEFAULT_CHANNELS = [
    'geopolitics_live',
    'intel_republic',
    'disclosetv',
    'bellumpacta_news',
    'insiderpaper'
];

interface TelegramPost {
    id: string;
    channel: string;
    text: string;
    date: string;
    link: string;
    views?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
}

/**
 * Telegram Collector - Public Channel Intelligence
 * Source: Public Telegram Web View (t.me/s/...)
 * Data: Real-time intelligence, breaking news, uncensored reports
 */
export class TelegramCollector extends BaseCollector {
    private geocoder = getGeocodingService();
    private channels: string[];
    private region: string;

    constructor(supabase: SupabaseClient, region: string = 'GLOBAL', customChannels?: string[]) {
        const config: CollectorConfig = {
            name: `TELEGRAM_${region}`,
            cacheDurationSeconds: 300, // 5 minutes (very fast moving)
            rateLimitPerMinute: 10,
            maxRetries: 2,
            circuitBreakerThreshold: 3,
            circuitBreakerTimeout: 600
        };
        super(config, supabase);
        this.region = region;

        if (customChannels && customChannels.length > 0) {
            this.channels = customChannels;
        } else {
            // Fallback to Env or Defaults for Global
            this.channels = process.env.TELEGRAM_CHANNELS
                ? process.env.TELEGRAM_CHANNELS.split(',').map(c => c.trim())
                : DEFAULT_CHANNELS;
        }
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const allEvents: MonitorEvent[] = [];
        // Use this.channels instead of global TARGET_CHANNELS
        const targetList = this.channels;

        // Process channels in parallel but limit concurrency to avoid IP blocks
        // We'll process them in chunks of 2
        for (let i = 0; i < targetList.length; i += 2) {
            const chunk = targetList.slice(i, i + 2);
            const promises = chunk.map(channel => this.fetchChannel(channel));

            const results = await Promise.allSettled(promises);

            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    allEvents.push(...result.value);
                }
            });

            // Small delay between chunks
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log(`📱 Telegram [${this.region}]: Collected ${allEvents.length} total events from ${targetList.length} channels`);

        // Deduplicate based on similar text (simple approach) or ID
        // Returning top 30 most recent
        return allEvents
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 30);
    }

    private async fetchChannel(channelName: string): Promise<MonitorEvent[]> {
        try {
            const url = `https://t.me/s/${channelName}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch channel ${channelName}: ${response.status}`);
            }

            const html = await response.text();
            const posts = await this.parseHtml(html, channelName);

            // Filter relevant posts
            const relevantPosts = posts.filter(post => this.isRelevant(post.text));

            console.log(`📱 Telegram [${channelName}]: Found ${relevantPosts.length} relevant posts`);

            // Convert to MonitorEvents
            const events: MonitorEvent[] = [];

            for (const post of relevantPosts.slice(0, 5)) { // Limit to 5 per channel to save processing
                const event = await this.processPost(post);
                if (event) events.push(event);
            }

            return events;
        } catch (error) {
            console.warn(`Error fetching ${channelName}:`, error);
            return [];
        }
    }

    private async parseHtml(html: string, channel: string): Promise<TelegramPost[]> {
        // Dynamic import for jsdom
        let DOMParser;
        if (typeof window === 'undefined') {
            const jsdom = await import('jsdom');
            const { JSDOM } = jsdom;
            const dom = new JSDOM(html);
            DOMParser = dom.window.DOMParser;
            // Use document from JSDOM
            const doc = dom.window.document;
            return this.extractPostsFromDoc(doc, channel);
        } else {
            const parser = new window.DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            return this.extractPostsFromDoc(doc, channel);
        }
    }

    private extractPostsFromDoc(doc: Document, channel: string): TelegramPost[] {
        const posts: TelegramPost[] = [];
        const elements = doc.querySelectorAll('.tgme_widget_message_wrap');

        elements.forEach(element => {
            const textElement = element.querySelector('.tgme_widget_message_text');
            if (!textElement || !textElement.textContent) return;

            const text = textElement.textContent.trim();
            if (text.length < 20) return; // Skip very short messages

            const dateElement = element.querySelector('.tgme_widget_message_date time');
            const dateStr = dateElement?.getAttribute('datetime');

            const linkElement = element.querySelector('.tgme_widget_message_date');
            const link = linkElement?.getAttribute('href') || '';

            // ID from link (e.g., https://t.me/channel/123)
            const id = link.split('/').pop() || Math.random().toString(36).substr(2, 9);

            const viewsElement = element.querySelector('.tgme_widget_message_views');
            const views = viewsElement?.textContent || '0';

            // Extract Media (Images/Videos)
            let mediaUrl: string | undefined = undefined;
            let mediaType: 'image' | 'video' | undefined = undefined;

            const photoWrap = element.querySelector('.tgme_widget_message_photo_wrap');
            if (photoWrap) {
                const style = photoWrap.getAttribute('style') || '';
                const match = style.match(/background-image:url\('([^']+)'\)/);
                if (match && match[1]) {
                    mediaUrl = match[1];
                    mediaType = 'image';
                }
            } else {
                const videoEl = element.querySelector('.tgme_widget_message_video');
                if (videoEl) {
                    const src = videoEl.getAttribute('src');
                    if (src) {
                        mediaUrl = src;
                        mediaType = 'video';
                    }
                }
            }

            if (dateStr) {
                posts.push({
                    id,
                    channel,
                    text,
                    date: dateStr,
                    link,
                    views,
                    mediaUrl,
                    mediaType
                });
            }
        });

        return posts;
    }

    private isRelevant(text: string): boolean {
        const t = text.toLowerCase();
        const keywords = [
            'breaking', 'urgent', 'alert', 'war', 'attack', 'explosion',
            'military', 'nuclear', 'cyber', 'crisis', 'virus', 'outbreak',
            'earthquake', 'tsunami', 'volcano'
        ];

        return keywords.some(k => t.includes(k));
    }

    private async processPost(post: TelegramPost): Promise<MonitorEvent | null> {
        // Extract title (first line)
        const lines = post.text.split('\n');
        let title = lines[0].substring(0, 100);
        if (title.length < 10 && lines.length > 1) title = lines[1].substring(0, 100);

        // Determine Category
        const category = this.determineCategory(post.text);

        // Determine Severity
        const severity = this.determineSeverity(post.text);

        // Geocoding
        const geocodeRequest = {
            text: post.text,
            priority: severity === 'CRITICAL' ? 'high' : 'normal',
            context: {
                // Provide region as context to help disambiguate (e.g. "Cordoba" -> Cordoba, Argentina vs Spain)
                country: this.region !== 'GLOBAL' && !this.region.includes('_') ? this.region : undefined
            }
        };

        let location = 'Global';
        let coordinates = { lat: 0, lng: 0 };

        // ATTEMPT GEOCODING FOR ALL EVENTS to fix positioning
        try {
            const geoResult = await this.geocoder.geocode(geocodeRequest);
            if (geoResult.success && geoResult.location) {
                location = geoResult.location.city || geoResult.location.region || geoResult.location.country || geoResult.location.name || location;
                coordinates = { lat: geoResult.location.lat, lng: geoResult.location.lng };
            } else {
                // Fallback to Region Center if geocoding fails
                if (this.region !== 'GLOBAL') {
                    location = this.region.replace('_', ' ');
                    // We rely on BaseCollector or subsequent logic to set default Lat/Lng for region if (0,0)
                }
            }
        } catch (e) {
            console.warn(`Geocoding failed for ${post.id}:`, e);
            if (this.region !== 'GLOBAL') {
                location = this.region.replace('_', ' ');
            }
        }

        // Small delay to be nice to rate limits since we are processing more now
        await new Promise(r => setTimeout(r, 500));

        return {
            id: `tg_${post.channel}_${post.id}`,
            title: `[${post.channel}] ${title}`,
            description: post.text.substring(0, 500), // Limit length
            category,
            severity,
            sourceType: 'SOCIAL_MEDIA',
            sourceName: `Telegram (${post.channel})`,
            location,
            coordinates,
            timestamp: post.date,
            priority: severity === 'CRITICAL' ? 1 : severity === 'HIGH' ? 2 : 3,
            sourceUrl: `https://t.me/s/${post.channel}/${post.id}`,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType
        };
    }

    private determineCategory(text: string): EventCategory {
        const t = text.toLowerCase();
        if (t.includes('war') || t.includes('military') || t.includes('troops') || t.includes('strike')) return EventCategory.CONFLICT;
        if (t.includes('earthquake') || t.includes('flood')) return EventCategory.NATURAL_DISASTER;
        if (t.includes('protest') || t.includes('riot')) return EventCategory.POLITICAL;
        if (t.includes('cyber') || t.includes('hacker')) return EventCategory.CYBER;
        if (t.includes('virus') || t.includes('pandemic')) return EventCategory.EPIDEMIC;
        return EventCategory.CONFLICT; // Default high interest
    }

    private determineSeverity(text: string): Severity {
        const t = text.toLowerCase();
        if (t.includes('nuclear') || t.includes('ww3') || (t.includes('breaking') && t.includes('war'))) return 'CRITICAL';
        if (t.includes('urgent') || t.includes('attack') || t.includes('dead')) return 'HIGH';
        return 'MEDIUM';
    }
}
