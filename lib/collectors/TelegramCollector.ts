
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity, SourceType } from '../../types';
import { getGeocodingService } from '../services/GeocodingService';
import { resolveLocation } from '../services/LocationResolver';

// Canal próprio (05/11/2026): @geopoliticaenoticias, "Notícias e Geopolítica". O conteúdo
// é do dono do site, então a restrição de 07/10/2026 a canais de terceiros não se aplica.
export const OWN_CHANNEL = 'geopoliticaenoticias';

// Priority channels for intelligence (terceiros: não usar, ver CollectorOrchestrator)
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
    /** Canal curado: todo post entra, sem filtro de palavra-chave. */
    private acceptAll: boolean;

    constructor(supabase: SupabaseClient, region: string = 'GLOBAL', customChannels?: string[], acceptAll = false) {
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
        this.acceptAll = acceptAll;

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
            const relevantPosts = this.acceptAll ? posts : posts.filter(post => this.isRelevant(post.text));

            console.log(`📱 Telegram [${channelName}]: Found ${relevantPosts.length} relevant posts`);

            // Convert to MonitorEvents
            const events: MonitorEvent[] = [];

            // Canal próprio: os 10 mais recentes (a página mostra ~15); terceiros: 5.
            for (const post of relevantPosts.slice(-(this.acceptAll ? 10 : 5))) {
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
            // <br> vira quebra de linha: senão a manchete gruda no corpo do post.
            textElement.querySelectorAll('br').forEach(br => br.replaceWith('\n'));

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
            'earthquake', 'tsunami', 'volcano',
            'urgente', 'alerta', 'guerra', 'ataque', 'explosão', 'militar',
            'nuclear', 'crise', 'surto', 'terremoto', 'vulcão'
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

        // Geocoding — title-first keyword resolver, then AI only for CRITICAL/HIGH
        const postTitle = lines[0].length > 10 ? lines[0] : (lines[1] || lines[0]);
        const postDesc = post.text.substring(postTitle.length, 400);

        let location = 'Global';
        let coordinates = { lat: 0, lng: 0 };

        // Step 1: keyword resolver (zero API cost)
        const resolved = resolveLocation(postTitle, postDesc);
        if (resolved) {
            location = resolved.name;
            coordinates = resolved.coords;
        } else if (severity === 'CRITICAL' || severity === 'HIGH') {
            // Step 2: AI geocoding for important items only
            try {
                const geoResult = await this.geocoder.geocode({
                    text: postTitle,
                    priority: 'high',
                    context: {
                        country: !this.acceptAll && this.region !== 'GLOBAL' && !this.region.includes('_') ? this.region : undefined
                    }
                });
                if (geoResult.success && geoResult.location) {
                    location = geoResult.location.city || geoResult.location.country || location;
                    coordinates = { lat: geoResult.location.lat, lng: geoResult.location.lng };
                } else if (this.region !== 'GLOBAL') {
                    location = this.regionLabel();
                }
            } catch (e) {
                console.warn(`Geocoding failed for ${post.id}:`, e);
                if (this.region !== 'GLOBAL') location = this.regionLabel();
            }
        } else if (this.region !== 'GLOBAL') {
            location = this.regionLabel();
        }

        // Small delay to be nice to rate limits since we are processing more now
        await new Promise(r => setTimeout(r, 500));

        return {
            id: `tg_${post.channel}_${post.id}`,
            title: this.acceptAll ? title : `[${post.channel}] ${title}`,
            description: post.text.substring(0, 500), // Limit length
            category,
            severity,
            sourceType: SourceType.TELEGRAM,
            sourceName: this.acceptAll ? `@${post.channel}` : `Telegram (${post.channel})`,
            location,
            coordinates,
            timestamp: post.date,
            priority: severity === 'CRITICAL' ? 1 : severity === 'HIGH' ? 2 : 3,
            sourceUrl: `https://t.me/s/${post.channel}/${post.id}`,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType
        };
    }

    /** Local de reserva quando o post não cita lugar; o canal próprio não é uma região. */
    private regionLabel(): string {
        return this.acceptAll ? 'Global' : this.region.replace('_', ' ');
    }

    private determineCategory(text: string): EventCategory {
        const t = text.toLowerCase();
        const has = (...words: string[]) => words.some(w => t.includes(w));
        if (has('war', 'military', 'troops', 'strike', 'guerra', 'militar', 'tropas', 'míssil', 'missil', 'bombardeio', 'ataque')) return EventCategory.CONFLICT;
        if (has('earthquake', 'flood', 'terremoto', 'sismo', 'enchente', 'inunda', 'chuvas intensas', 'tempestade', 'furacão', 'vulcão', 'tsunami', 'incêndio florestal')) return EventCategory.NATURAL_DISASTER;
        if (has('cyber', 'hacker', 'ciberataque', 'ataque hacker', 'vazamento de dados')) return EventCategory.CYBER;
        if (has('virus', 'pandemic', 'vírus', 'pandemia', 'surto', 'epidemia')) return EventCategory.EPIDEMIC;
        if (has('protest', 'riot', 'protesto', 'manifestação', 'eleição', 'presidente', 'governo', 'congresso', 'stf')) return EventCategory.POLITICAL;
        // Canal próprio cobre geopolítica em geral; terceiros eram de conflito.
        return this.acceptAll ? EventCategory.POLITICAL : EventCategory.CONFLICT;
    }

    private determineSeverity(text: string): Severity {
        const t = text.toLowerCase();
        if (t.includes('nuclear') || t.includes('ww3') || (t.includes('breaking') && t.includes('war'))
            || t.includes('terceira guerra')) return 'CRITICAL';
        if (t.includes('urgent') || t.includes('attack') || t.includes('dead')
            || t.includes('urgente') || t.includes('ataque') || t.includes('mortos') || t.includes('mortes')) return 'HIGH';
        return 'MEDIUM';
    }
}
