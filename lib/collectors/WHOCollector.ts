import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

// WHO changed their RSS structure - using news feed instead
const WHO_NEWS_URL = 'https://www.who.int/rss-feeds/news-english.xml';

interface WHOEvent {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    guid: string;
}

/**
 * WHO Disease Outbreak News Collector
 * Source: WHO RSS feed
 * Data: Epidemics, pandemics, health emergencies
 */
export class WHOCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'WHO',
            cacheDurationSeconds: 3600, // 1 hour
            rateLimitPerMinute: 30,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 1800
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const response = await fetch(WHO_NEWS_URL, {
            headers: {
                'Accept': 'application/xml, text/xml',
                'User-Agent': 'EndTimesMonitor/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`WHO API error: ${response.status}`);
        }

        const xmlText = await response.text();
        const whoEvents = await this.parseWHOXML(xmlText);

        console.log(`🏥 WHO: Received ${whoEvents.length} disease outbreak alerts`);

        // Filter to only significant outbreaks
        const filtered = whoEvents.filter(event => {
            const title = event.title.toLowerCase();
            const desc = event.description.toLowerCase();

            // High priority keywords
            return (
                title.includes('outbreak') ||
                title.includes('epidemic') ||
                title.includes('pandemic') ||
                title.includes('emergency') ||
                desc.includes('deaths') ||
                desc.includes('cases')
            );
        });

        console.log(`🏥 WHO: Filtered to ${filtered.length} significant outbreaks`);

        return filtered.slice(0, 30).map(event => ({
            id: this.generateId(event.guid),
            title: event.title,
            description: this.cleanDescription(event.description),
            category: EventCategory.EPIDEMIC,
            severity: this.determineSeverity(event.title, event.description),
            sourceType: 'OFFICIAL' as const,
            sourceName: 'WHO',
            location: this.extractLocation(event.title),
            coordinates: this.estimateCoordinates(event.title),
            timestamp: new Date(event.pubDate).toISOString(),
            sourceUrl: event.link
        }));
    }

    private async parseWHOXML(xmlText: string): Promise<WHOEvent[]> {
        // Use jsdom in Node.js
        let parser: DOMParser;

        if (typeof DOMParser === 'undefined') {
            const jsdom = await import('jsdom');
            const dom = new jsdom.JSDOM();
            parser = new dom.window.DOMParser();
        } else {
            parser = new DOMParser();
        }

        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const items = xmlDoc.querySelectorAll('item');
        const events: WHOEvent[] = [];

        items.forEach(item => {
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
            const guid = item.querySelector('guid')?.textContent || link;

            if (title && link) {
                events.push({ title, link, description, pubDate, guid });
            }
        });

        return events;
    }

    private determineSeverity(title: string, description: string): Severity {
        const text = `${title} ${description}`.toLowerCase();

        // Pandemic or international emergency
        if (text.includes('pandemic') || text.includes('pheic') || text.includes('international concern')) {
            return 'CRITICAL';
        }

        // High fatality or rapid spread
        if (text.includes('death') || text.includes('fatal') || text.includes('hemorrhagic')) {
            return 'HIGH';
        }

        // Significant outbreak
        if (text.includes('outbreak') || text.includes('epidemic')) {
            return 'ELEVATED';
        }

        return 'MEDIUM';
    }

    private extractLocation(title: string): string {
        // WHO titles often in format: "Disease Name - Country"
        const parts = title.split(' – ');
        if (parts.length >= 2) {
            return parts[parts.length - 1].trim();
        }

        const lastDash = title.lastIndexOf('-');
        if (lastDash > 0) {
            return title.substring(lastDash + 1).trim();
        }

        return 'Global';
    }

    private estimateCoordinates(title: string): { lat: number; lng: number } {
        // Basic country mapping (will be improved with geocoding service)
        const location = this.extractLocation(title).toLowerCase();

        if (location.includes('congo') || location.includes('drc')) {
            return { lat: -4.0383, lng: 21.7587 };
        }
        if (location.includes('nigeria')) {
            return { lat: 9.0820, lng: 8.6753 };
        }
        if (location.includes('india')) {
            return { lat: 20.5937, lng: 78.9629 };
        }
        if (location.includes('brazil')) {
            return { lat: -14.2350, lng: -51.9253 };
        }
        if (location.includes('china')) {
            return { lat: 35.8617, lng: 104.1954 };
        }
        if (location.includes('afghanistan')) {
            return { lat: 33.9391, lng: 67.7100 };
        }
        if (location.includes('syria')) {
            return { lat: 34.8021, lng: 38.9968 };
        }
        if (location.includes('yemen')) {
            return { lat: 15.5527, lng: 48.5164 };
        }

        // Default to Geneva (WHO headquarters)
        return { lat: 46.2044, lng: 6.1432 };
    }

    private cleanDescription(html: string): string {
        // Remove HTML tags
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim()
            .substring(0, 500);
    }

    private generateId(guid: string): string {
        // Use guid or generate from hash
        if (guid) {
            return guid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
        }
        return Math.random().toString(36).substr(2, 9);
    }
}
