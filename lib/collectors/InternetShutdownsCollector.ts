import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

const FEED_URL = 'https://pulse.internetsociety.org/feed';

export class InternetShutdownsCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'INTERNET_SHUTDOWNS',
            cacheDurationSeconds: 3600,
            rateLimitPerMinute: 10,
            maxRetries: 3
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const response = await fetch(FEED_URL, { headers: { 'User-Agent': 'EndTimesMonitor/1.0' } });
        if (!response.ok) throw new Error(`Feed fetch failed: ${response.status}`);

        const xml = await response.text();
        const items = await this.parseRSS(xml);

        console.log(`🌐 InternetPulse: Received ${items.length} updates`);

        return items
            .filter(item => item.title.toLowerCase().includes('shutdown') || item.title.toLowerCase().includes('disruption'))
            .map(item => ({
                id: this.generateId(item.link),
                title: item.title,
                description: item.description,
                category: EventCategory.POLITICAL, // Often political tool
                severity: 'ELEVATED',
                sourceType: 'NEWS',
                sourceName: 'Internet Society Pulse',
                location: this.extractLocation(item.title),
                coordinates: { lat: 0, lng: 0 },
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

    private extractLocation(title: string): string {
        // Often "Internet shutdown in Country"
        if (title.includes(' in ')) {
            return title.split(' in ')[1].split(':')[0].trim();
        }
        return 'Global';
    }

    private generateId(url: string): string {
        return url.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    }
}
