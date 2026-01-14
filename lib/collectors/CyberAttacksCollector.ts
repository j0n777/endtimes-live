import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

const FEED_URL = 'https://feeds.feedburner.com/TheHackersNews';

interface RSSItem {
    title: string;
    link: string;
    contentSnippet?: string;
    pubDate: string;
    categories?: string[];
}

/**
 * Cyber Attacks Collector
 * Source: The Hacker News RSS
 * Data: Major cyber security breaches, ransomware, zero-days
 */
export class CyberAttacksCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'CYBER_ATTACKS',
            cacheDurationSeconds: 3600, // 1 hour
            rateLimitPerMinute: 10,
            maxRetries: 3
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        // We use a simple xml parser since RSS is XML
        // Or fetch via an RSS-to-JSON bridge if available. 
        // Since we have jsdom, we can parse XML directly.

        const response = await fetch(FEED_URL, {
            headers: { 'User-Agent': 'EndTimesMonitor/1.0' }
        });

        if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);

        const xmlText = await response.text();
        const items = await this.parseRSS(xmlText);

        console.log(`💻 Cyber: Received ${items.length} news items`);

        // Filter for major incidents
        const criticalKeywords = ['ransomware', 'breach', 'hack', 'zero-day', 'vulnerability', 'attack'];

        return items
            .filter(item => criticalKeywords.some(k => item.title.toLowerCase().includes(k)))
            .slice(0, 15)
            .map(item => ({
                id: this.generateId(item.link),
                title: item.title,
                description: item.contentSnippet || item.title,
                category: EventCategory.CYBER,
                severity: this.determineSeverity(item.title),
                sourceType: 'NEWS',
                sourceName: 'The Hacker News',
                location: 'Global (Cyber)',
                coordinates: { lat: 0, lng: 0 }, // Cyber has no location usually
                timestamp: new Date(item.pubDate).toISOString(),
                sourceUrl: item.link
            }));
    }

    private async parseRSS(xml: string): Promise<RSSItem[]> {
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
        const items: RSSItem[] = [];

        itemElements.forEach(el => {
            items.push({
                title: el.querySelector('title')?.textContent || '',
                link: el.querySelector('link')?.textContent || '',
                contentSnippet: el.querySelector('description')?.textContent || '',
                pubDate: el.querySelector('pubDate')?.textContent || new Date().toISOString()
            });
        });

        return items;
    }

    private determineSeverity(title: string): Severity {
        const t = title.toLowerCase();
        if (t.includes('zero-day') || t.includes('massive breach') || t.includes('infrastructure')) return 'HIGH';
        if (t.includes('ransomware')) return 'ELEVATED';
        return 'MEDIUM';
    }

    private generateId(url: string): string {
        return url.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    }
}
