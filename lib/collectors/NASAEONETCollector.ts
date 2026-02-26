import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

const NASA_EONET_BASE_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';

interface EONETEvent {
    id: string;
    title: string;
    description: string | null;
    link: string;
    categories: Array<{ id: string; title: string }>;
    sources: Array<{ id: string; url: string }>;
    geometry: Array<{
        date: string;
        type: string;
        coordinates: number[];
    }>;
}

export class NASAEONETCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'NASA_EONET',
            cacheDurationSeconds: 1800, // 30 minutes
            rateLimitPerMinute: 60,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 1800
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const apiKey = process.env.NASA_EONET_API_KEY || process.env.VITE_NASA_EONET_API_KEY || '';
        const url = apiKey
            ? `${NASA_EONET_BASE_URL}?status=open&api_key=${apiKey}`
            : `${NASA_EONET_BASE_URL}?status=open`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NASA EONET API error: ${response.status}`);
        }

        const data = await response.json();
        const events: EONETEvent[] = data.events || [];

        console.log(`🛰️ NASA EONET: Received ${events.length} total events`);

        // Filter: Last 7 days only to prevent map clutter
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);

        const recentEvents = events.filter(e => {
            // Ignore closed events
            if (e.closed) return false;

            // Check last update date
            const lastDate = e.geometry && e.geometry.length > 0
                ? new Date(e.geometry[e.geometry.length - 1].date)
                : new Date(0); // Old if no date

            return lastDate >= cutoffDate;
        });

        console.log(`🛰️ NASA EONET: Filtered to ${recentEvents.length} active events (last 7 days)`);

        // Map and filter events
        const mappedEvents = recentEvents.map(event => {
            const category = this.mapCategory(event.categories[0]?.id || 'unknown');
            const severity = this.determineSeverity(category, event.categories[0]?.id);

            // Get most recent coordinates
            const latestGeometry = event.geometry[event.geometry.length - 1];
            const coords = this.extractCoordinates(latestGeometry);

            return {
                id: event.id,
                title: event.title,
                description: event.description || 'Natural event detected by NASA satellites',
                category,
                severity,
                sourceType: 'OFFICIAL' as const,
                sourceName: 'NASA EONET',
                location: this.getLocationName(coords.lat, coords.lng),
                coordinates: coords,
                timestamp: latestGeometry.date || new Date().toISOString(),
                // Fix: Avoid linking to .tcw/.json/download files directly
                sourceUrl: (event.link && !event.link.includes('download'))
                    ? event.link
                    : `https://eonet.gsfc.nasa.gov/`,
            };
        });

        // INTELLIGENT FILTERING: Only HIGH and ELEVATED severity
        // This reduces 5000+ events to ~50 critical ones
        const filtered = mappedEvents.filter(event =>
            event.severity === 'HIGH' || event.severity === 'ELEVATED'
        );

        console.log(`🛰️ NASA EONET: Filtered to ${filtered.length} HIGH/ELEVATED severity events (from ${events.length} total)`);

        // Sort by severity (HIGH first) and limit to top 50
        const prioritized = filtered
            .sort((a, b) => {
                const severityOrder = { 'HIGH': 0, 'ELEVATED': 1, 'MEDIUM': 2, 'LOW': 3 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            })
            .slice(0, 50);

        console.log(`🛰️ NASA EONET: Limited to top ${prioritized.length} most critical events`);

        return prioritized;
    }

    private extractCoordinates(geometry: any): { lat: number; lng: number } {
        if (!geometry || !geometry.coordinates) {
            return { lat: 0, lng: 0 };
        }

        const coords = geometry.coordinates;

        if (geometry.type === 'Point') {
            // Point: [lng, lat]
            return { lat: coords[1], lng: coords[0] };
        } else if (geometry.type === 'Polygon') {
            // Polygon: take first point of first ring
            return { lat: coords[0][0][1], lng: coords[0][0][0] };
        }

        return { lat: 0, lng: 0 };
    }

    private mapCategory(eonetCategory: string): EventCategory {
        const cat = eonetCategory.toLowerCase();

        if (cat.includes('wildfire') || cat.includes('fire')) {
            return EventCategory.FIRES;
        }
        if (cat.includes('storm') || cat.includes('hurricane') || cat.includes('cyclone')) {
            return EventCategory.NATURAL_DISASTER;
        }
        if (cat.includes('volcano') || cat.includes('earthquake') || cat.includes('tsunami')) {
            return EventCategory.NATURAL_DISASTER;
        }
        if (cat.includes('flood') || cat.includes('drought')) {
            return EventCategory.NATURAL_DISASTER;
        }

        return EventCategory.NATURAL_DISASTER;
    }

    private determineSeverity(category: EventCategory, eonetCategory: string): Severity {
        const cat = eonetCategory.toLowerCase();

        if (cat.includes('volcano') || cat.includes('tsunami') || cat.includes('earthquake')) {
            return 'HIGH';
        }
        if (cat.includes('storm') || cat.includes('cyclone') || cat.includes('flood')) {
            return 'ELEVATED';
        }

        return 'MEDIUM';
    }

    private getLocationName(lat: number, lng: number): string {
        if (lat > 35 && lng > -125 && lng < -65) return 'North America';
        if (lat > 25 && lat < 50 && lng > -10 && lng < 40) return 'Mediterranean/Middle East';
        if (lat < 10 && lat > -35 && lng > -80 && lng < -30) return 'South America';
        if (lat > -35 && lat < 40 && lng > -20 && lng < 55) return 'Africa';
        if (lat > -50 && lat < 60 && lng > 60 && lng < 180) return 'Asia/Pacific';
        if (lat > 40 && lng > -10 && lng < 40) return 'Europe';
        return 'Global';
    }
}
