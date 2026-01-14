import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

// Australian Smartraveller RSS (More reliable than US State Dept currently)
const EMBASSY_FEED = 'https://www.smartraveller.gov.au/rss';

/**
 * Embassy Collector - Travel Advisories
 * Source: Australian Government (Smartraveller)
 * Data: Security alerts, do not travel warnings
 */
export class EmbassyCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'EMBASSY',
            cacheDurationSeconds: 86400, // 24 hours
            rateLimitPerMinute: 10,
            maxRetries: 3
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const response = await fetch(EMBASSY_FEED, {
            headers: { 'User-Agent': 'EndTimesMonitor/1.0' }
        });

        if (!response.ok) throw new Error(`Embassy fetch failed: ${response.status}`);

        const xml = await response.text();
        const items = await this.parseRSS(xml);

        console.log(`🏛️ Embassy: Received ${items.length} advisories`);

        // Filter for Level 3 (Reconsider) and Level 4 (Do Not Travel)
        const significant = items.filter(item =>
            item.title.includes('Level 4') ||
            item.title.includes('Level 3') ||
            item.title.includes('Security Alert')
        );

        console.log(`🏛️ Embassy: Filtered to ${significant.length} high-risk advisories`);

        return significant.slice(0, 50).map(item => ({
            id: this.generateId(item.link),
            title: item.title,
            description: item.description,
            category: EventCategory.POLITICAL,
            severity: this.determineSeverity(item.title),
            sourceType: 'OFFICIAL',
            sourceName: 'US State Dept',
            location: this.extractLocation(item.title),
            coordinates: { lat: 0, lng: 0 }, // Will rely on Geocoding Service later or basic map
            timestamp: new Date(item.pubDate).toISOString(),
            sourceUrl: item.link
        }));
    }

    private async parseRSS(xml: string): Promise<any[]> {
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
                description: el.querySelector('description')?.textContent || '',
                pubDate: el.querySelector('pubDate')?.textContent || new Date().toISOString()
            });
        });

        return items;
    }

    private determineSeverity(title: string): Severity {
        if (title.includes('Level 4')) return 'HIGH';
        if (title.includes('Level 3')) return 'ELEVATED';
        return 'MEDIUM';
    }

    private extractLocation(title: string): string {
        // Format: "Country - Level X: ..."
        const parts = title.split('-');
        if (parts.length > 0) return parts[0].trim();
        return 'Global';
    }

    private generateId(url: string): string {
        return url.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    }
}
