import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

// Using a reliable Nitter instance for RSS
const NITTER_HOST = 'https://nitter.privacydev.net';
const ACCOUNTS = [
    'sentdefender',
    'Faytuks',
    'WarMonitors',
    'OSINTtechnical'
];

/**
 * Twitter Collector (via Nitter RSS)
 * Source: Public Nitter instances
 * Data: Breaking news, OSINT from X/Twitter
 */
export class TwitterCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'TWITTER',
            cacheDurationSeconds: 300,
            rateLimitPerMinute: 10,
            maxRetries: 2,
            circuitBreakerThreshold: 3,
            circuitBreakerTimeout: 1800
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const allEvents: MonitorEvent[] = [];

        // Process accounts in parallel (limited)
        for (const account of ACCOUNTS) {
            try {
                const url = `${NITTER_HOST}/${account}/rss`;
                const response = await fetch(url, { headers: { 'User-Agent': 'EndTimesMonitor/1.0' } });

                if (!response.ok) {
                    console.warn(`Twitter: Failed to fetch ${account} (${response.status})`);
                    continue;
                }

                const xml = await response.text();
                const items = await this.parseRSS(xml, account);

                // Filter keywords
                const relevant = items.filter(item => this.isRelevant(item.title));
                console.log(`🐦 Twitter [@${account}]: Found ${relevant.length} relevant tweets`);

                allEvents.push(...relevant.slice(0, 5).map(item => ({
                    id: this.generateId(item.link),
                    title: `@${account}: ${this.truncate(item.title)}`,
                    description: item.title, // RSS title is the tweet text often
                    category: EventCategory.CONFLICT,
                    severity: this.determineSeverity(item.title),
                    sourceType: 'SOCIAL_MEDIA',
                    sourceName: `X (${account})`,
                    location: 'Global', // Would need complex geocoding
                    coordinates: { lat: 0, lng: 0 },
                    timestamp: new Date(item.pubDate).toISOString(),
                    sourceUrl: item.link
                })));

                // Nice delay
                await new Promise(r => setTimeout(r, 1000));

            } catch (error) {
                console.warn(`Twitter: Error fetching ${account}`, error);
            }
        }

        return allEvents;
    }

    private async parseRSS(xml: string, account: string): Promise<any[]> {
        let parser: DOMParser;
        if (typeof DOMParser === 'undefined') {
            const jsdom = await import('jsdom');
            const dom = new jsdom.JSDOM();
            parser = new dom.window.DOMParser();
        } else {
            parser = new DOMParser();
        }

        const doc = parser.parseFromString(xml, 'text/xml');
        const itemElements = doc.querySelectorAll('item');
        const items: any[] = [];

        itemElements.forEach(el => {
            items.push({
                title: el.querySelector('title')?.textContent || '',
                link: el.querySelector('link')?.textContent || '',
                pubDate: el.querySelector('pubDate')?.textContent || new Date().toISOString()
            });
        });

        return items;
    }

    private isRelevant(text: string): boolean {
        const t = text.toLowerCase();
        return t.includes('breaking') || t.includes('alert') || t.includes('urgent') || t.includes('war') || t.includes('strike');
    }

    private determineSeverity(text: string): Severity {
        const t = text.toLowerCase();
        if (t.includes('nuclear') || t.includes('ww3')) return 'CRITICAL';
        if (t.includes('breaking') || t.includes('urgent')) return 'HIGH';
        return 'MEDIUM';
    }

    private truncate(str: string): string {
        return str.length > 80 ? str.substring(0, 77) + '...' : str;
    }

    private generateId(url: string): string {
        return url.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    }
}
