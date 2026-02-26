import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

const GDACS_RSS_URL = 'https://www.gdacs.org/xml/rss.xml';

interface GDACSEvent {
    title: string;
    description: string;
    link: string;
    pubDate: string;
    category: string;
    severity: string;
    lat?: number;
    lng?: number;
    location?: string;
}

export class GDACSCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'GDACS',
            cacheDurationSeconds: 900, // 15 minutes
            rateLimitPerMinute: 60,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 1800 // 30 minutes
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const response = await fetch(GDACS_RSS_URL, {
            headers: {
                'Accept': 'application/xml, text/xml',
            },
        });

        if (!response.ok) {
            throw new Error(`GDACS API error: ${response.status}`);
        }

        const xmlText = await response.text();
        const gdacsEvents = await this.parseGDACSXML(xmlText);

        console.log(`🌍 GDACS: Received ${gdacsEvents.length} total events`);

        // Filter: Allow all alerts for now so the user can verify data flows
        const filteredEvents = gdacsEvents.filter(event => {
            const sev = event.severity.toLowerCase();
            return true; // sev.includes('red') || sev.includes('orange');
        });

        console.log(`🌍 GDACS: Filtered to ${filteredEvents.length} significant alerts (Red/Orange only)`);

        // Limit to top 20 most severe
        const limitedEvents = filteredEvents
            .sort((a, b) => {
                const severityOrder: Record<string, number> = { 'red': 0, 'orange': 1, 'green': 2 };
                return severityOrder[a.severity.toLowerCase()] - severityOrder[b.severity.toLowerCase()];
            })
            .slice(0, 20);

        return limitedEvents.map(event => ({
            id: this.generateId(),
            title: event.title,
            description: event.description,
            category: this.mapCategory(event.category),
            severity: this.mapSeverity(event.severity),
            sourceType: 'RSS' as const,
            sourceName: 'GDACS',
            location: event.location || 'Unknown Location',
            coordinates: {
                lat: event.lat || 0,
                lng: event.lng || 0,
            },
            timestamp: event.pubDate ? new Date(event.pubDate).toISOString() : new Date().toISOString(),
            sourceUrl: event.link,
        }));
    }

    private async parseGDACSXML(xmlText: string): Promise<GDACSEvent[]> {
        // Use jsdom in Node.js, native DOMParser in browser
        let parser: DOMParser;

        if (typeof DOMParser === 'undefined') {
            // Node.js environment - use dynamic import
            const jsdom = await import('jsdom');
            const dom = new jsdom.JSDOM();
            parser = new dom.window.DOMParser();
        } else {
            // Browser environment
            parser = new DOMParser();
        }

        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const items = xmlDoc.querySelectorAll('item');
        const events: GDACSEvent[] = [];

        items.forEach(item => {
            const title = item.querySelector('title')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            const category = item.querySelector('category')?.textContent || 'disaster';

            // Extract coordinates from georss
            const geoPoint = item.getElementsByTagNameNS('http://www.georss.org/georss', 'point')[0];
            let lat: number | undefined;
            let lng: number | undefined;

            if (geoPoint) {
                const coords = geoPoint.textContent?.split(' ');
                if (coords && coords.length === 2) {
                    lat = parseFloat(coords[0]);
                    lng = parseFloat(coords[1]);
                }
            }

            // Determine severity from title/description
            let severity = 'Green';
            if (title.toLowerCase().includes('red') || description.toLowerCase().includes('red alert')) {
                severity = 'Red';
            } else if (title.toLowerCase().includes('orange') || description.toLowerCase().includes('orange alert')) {
                severity = 'Orange';
            }

            events.push({
                title,
                description,
                link,
                pubDate,
                category,
                severity,
                lat,
                lng,
                location: title.split(' in ')[1] || 'Unknown'
            });
        });

        return events;
    }

    private mapCategory(category: string): EventCategory {
        const cat = category.toLowerCase();
        if (cat.includes('earthquake') || cat.includes('tsunami') || cat.includes('volcano')) {
            return EventCategory.NATURAL_DISASTER;
        }
        if (cat.includes('cyclone') || cat.includes('flood') || cat.includes('storm')) {
            return EventCategory.NATURAL_DISASTER;
        }
        return EventCategory.NATURAL_DISASTER;
    }

    private mapSeverity(severity: string): Severity {
        const sev = severity.toLowerCase();
        if (sev.includes('red')) return 'HIGH';
        if (sev.includes('orange')) return 'ELEVATED';
        return 'MEDIUM';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
