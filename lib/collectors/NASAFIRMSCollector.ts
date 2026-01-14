import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import { isRelevantWildfire } from '../../services/nasa-firms-filter';

const NASA_FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

interface FIRMSFire {
    latitude: number;
    longitude: number;
    brightness: number;
    frp: number; // Fire Radiative Power
    confidence: string;
    acq_date: string;
    acq_time: string;
    satellite: string;
    daynight: string;
}

export class NASAFIRMSCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'NASA_FIRMS',
            cacheDurationSeconds: 10800, // 3 hours (data updates every 3-4h)
            rateLimitPerMinute: 10,
            rateLimitPerDay: 1000, // CRITICAL daily limit
            maxRetries: 2,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 3600
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const apiKey = process.env.NASA_FIRMS_API_KEY || process.env.VITE_NASA_FIRMS_API_KEY;

        if (!apiKey) {
            throw new Error('NASA FIRMS requires API_KEY in .env file');
        }

        const source = 'VIIRS_NOAA20_NRT';
        const dayRange = 7;
        const area = '-180,-90,180,90'; // World bounds

        const url = `${NASA_FIRMS_BASE_URL}/${apiKey}/${source}/${area}/${dayRange}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NASA FIRMS API error: ${response.status}`);
        }

        const csvText = await response.text();
        const fires = this.parseCSV(csvText);

        console.log(`🔥 NASA FIRMS: Received ${fires.length} total fires from API`);

        // INTELLIGENT WILDFIRE FILTER
        const relevantWildfires = fires
            .filter(fire => isRelevantWildfire({
                latitude: fire.latitude,
                longitude: fire.longitude,
                frp: fire.frp,
                confidence: fire.confidence,
                brightness: fire.brightness
            }))
            .filter(fire => fire.frp > 50) // Only significant fires (>50 MW)
            .sort((a, b) => b.frp - a.frp) // Sort by intensity
            .slice(0, 20); // Maximum 20 significant wildfires

        console.log(`🔥 NASA FIRMS: Filtered to ${relevantWildfires.length} SIGNIFICANT wildfires (FRP >50 MW)`);

        return relevantWildfires.map(fire => ({
            id: this.generateId(),
            title: `Active Fire Detected (FRP: ${fire.frp.toFixed(1)} MW)`,
            description: `Satellite: ${fire.satellite} | Confidence: ${fire.confidence.toUpperCase()} | Brightness: ${fire.brightness}K | Time: ${fire.daynight === 'D' ? 'Day' : 'Night'}`,
            category: EventCategory.FIRES,
            severity: this.determineSeverity(fire.frp, fire.confidence),
            sourceType: 'OFFICIAL' as const,
            sourceName: 'NASA FIRMS',
            location: this.getLocationName(fire.latitude, fire.longitude),
            coordinates: {
                lat: fire.latitude,
                lng: fire.longitude,
            },
            timestamp: new Date(`${fire.acq_date}T${fire.acq_time.padStart(4, '0').slice(0, 2)}:${fire.acq_time.padStart(4, '0').slice(2)}:00Z`).toISOString(),
            sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/map/',
        }));
    }

    private parseCSV(csvText: string): FIRMSFire[] {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',');
        const fires: FIRMSFire[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length !== headers.length) continue;

            const fire: any = {};
            headers.forEach((header, index) => {
                fire[header.trim()] = values[index].trim();
            });

            fires.push({
                latitude: parseFloat(fire.latitude),
                longitude: parseFloat(fire.longitude),
                brightness: parseFloat(fire.brightness),
                frp: parseFloat(fire.frp),
                confidence: fire.confidence,
                acq_date: fire.acq_date,
                acq_time: fire.acq_time,
                satellite: fire.satellite,
                daynight: fire.daynight,
            });
        }

        return fires;
    }

    private determineSeverity(frp: number, confidence: string): Severity {
        if (frp > 100 || confidence === 'h') return 'HIGH';
        if (frp > 50 || confidence === 'n') return 'ELEVATED';
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

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
