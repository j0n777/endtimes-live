import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

export class AviationCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'AVIATION_MILITARY',
            cacheDurationSeconds: 120, // 2 mins
            rateLimitPerMinute: 5,
            maxRetries: 2,
            circuitBreakerThreshold: 3,
            circuitBreakerTimeout: 300
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const allEvents: MonitorEvent[] = [];
        try {
            const url = 'https://opensky-network.org/api/states/all';
            const response = await fetch(url, { signal: AbortSignal.timeout(15000) });

            if (!response.ok) return this.fallbackMockedData();

            const data = await response.json();
            if (!data || !data.states) return [];

            const states = data.states;
            const militaryPrefixes = ['RCH', 'CFC', 'RRR', 'ASY', 'NATO', 'BART', 'SPAR', 'SNOOP', 'FORTE', 'UAV', 'HCE', 'AF1', 'SAM'];
            const emergencySquawks = ['7700', '7600', '7500'];

            for (const state of states) {
                const callsign: string = (state[1] || '').trim();
                const country: string = state[2] || 'Unknown';
                const lng: number = state[5];
                const lat: number = state[6];
                const alt: number = state[7];
                const velocity: number = state[9];
                const heading: number = state[10];
                const squawk: string = state[14];

                if (!lat || !lng) continue;

                let isMilitary = militaryPrefixes.some(prefix => callsign.startsWith(prefix));
                let isEmergency = emergencySquawks.includes(squawk);

                if (!isMilitary && !isEmergency) continue;

                let severity: Severity = 'LOW';
                let title = '';

                if (isEmergency) {
                    severity = 'CRITICAL';
                    title = `EMERGENCY SQUAWK ${squawk}: Flight ${callsign || 'Unknown'} (${country})`;
                } else if (callsign.startsWith('FORTE') || callsign.startsWith('UAV') || callsign.startsWith('NATO')) {
                    severity = 'HIGH';
                    title = `TACTICAL DRONE/ISR: ${callsign} (${country})`;
                } else {
                    severity = 'MEDIUM';
                    title = `MILITARY TRANSPORT/AIRCRAFT: ${callsign} (${country})`;
                }

                const speedKmh = velocity ? Math.round(velocity * 3.6) : 0;
                const altFt = alt ? Math.round(alt * 3.28084) : 0;

                // Stable daily ID: same callsign on the same UTC day = same event
                // Prevents re-insertion with new ID every 2-minute cycle
                const todayUTC = new Date().toISOString().split('T')[0].replace(/-/g, '');
                allEvents.push({
                    id: `flight_${callsign}_${todayUTC}`,
                    title: `[Aviation] ${title}`,
                    description: `Detected military or critical aircraft operating at ${altFt} ft. Speed: ${speedKmh} km/h. Heading: ${heading}°. Origin: ${country}.`,
                    category: EventCategory.AVIATION,
                    severity: severity,
                    sourceType: 'OFFICIAL',
                    sourceName: 'OpenSky Network',
                    location: `Airspace (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
                    coordinates: { lat, lng },
                    timestamp: new Date().toISOString(),
                    priority: severity === 'CRITICAL' ? 1 : severity === 'HIGH' ? 2 : 3,
                    sourceUrl: `https://globe.adsbexchange.com/?icao=${state[0]}`,
                    ...({ heading } as any)
                });
            }
            return allEvents;
        } catch (error) {
            return this.fallbackMockedData();
        }
    }

    private fallbackMockedData(): MonitorEvent[] {
        // Return empty array instead of static mock data.
        // Mock data with new Date() timestamp was causing FORTE11 to always
        // reappear at the top of the feed whenever OpenSky API was unavailable.
        return [];
    }
}
