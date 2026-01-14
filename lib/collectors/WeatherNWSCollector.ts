import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

// NWS API User Agent is required and must be specific
const USER_AGENT = '(end-times-monitor, user@localhost)';

interface NWSAlert {
    properties: {
        id: string;
        headline: string;
        description: string;
        severity: string; // Extreme, Severe, Moderate, Minor
        certainty: string;
        event: string;
        sent: string;
        areaDesc: string;
    };
    geometry: {
        type: string;
        coordinates: number[][][]; // Polygon
    };
}

/**
 * Weather NWS Collector - US Weather Alerts
 * Source: api.weather.gov
 * Data: Severe weather alerts (Tornado, Hurricane, Flood) for USA
 */
export class WeatherNWSCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'WEATHER_NWS',
            cacheDurationSeconds: 600, // 10 minutes
            rateLimitPerMinute: 60,
            maxRetries: 3
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        // Fetch active alerts
        // Limit to severe+ to avoid spam
        const url = 'https://api.weather.gov/alerts/active?severity=Extreme,Severe&limit=50';

        const response = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'application/geo+json'
            }
        });

        if (!response.ok) {
            throw new Error(`NWS API error: ${response.status} `);
        }

        const data = await response.json();
        const alerts: any[] = data.features || [];

        console.log(`🌪️ Weather NWS: Received ${alerts.length} active severe alerts`);

        return alerts.map((feature: any) => {
            const props = feature.properties;
            const coords = this.getCenterCoordinates(feature.geometry);

            return {
                id: props.id,
                title: props.headline || `${props.event} in ${props.areaDesc} `,
                description: props.description,
                category: EventCategory.NATURAL_DISASTER,
                severity: this.mapSeverity(props.severity),
                sourceType: 'OFFICIAL',
                sourceName: 'NWS',
                location: props.areaDesc,
                coordinates: coords,
                timestamp: props.sent,
                sourceUrl: 'https://www.weather.gov/'
            };
        });
    }

    private mapSeverity(nwsSeverity: string): Severity {
        switch (nwsSeverity.toLowerCase()) {
            case 'extreme': return 'CRITICAL';
            case 'severe': return 'HIGH';
            case 'moderate': return 'ELEVATED';
            default: return 'MEDIUM';
        }
    }

    private getCenterCoordinates(geometry: any): { lat: number; lng: number } {
        if (!geometry) return { lat: 37.0902, lng: -95.7129 }; // Default US center

        // Simple centroid calc for Polygon
        if (geometry.type === 'Polygon' && geometry.coordinates.length > 0) {
            const ring = geometry.coordinates[0];
            let latSum = 0, lngSum = 0;
            ring.forEach((coord: number[]) => {
                lngSum += coord[0];
                latSum += coord[1];
            });
            return {
                lat: latSum / ring.length,
                lng: lngSum / ring.length
            };
        }

        // Point
        if (geometry.type === 'Point') {
            return { lat: geometry.coordinates[1], lng: geometry.coordinates[0] };
        }

        return { lat: 37.0902, lng: -95.7129 };
    }
}
