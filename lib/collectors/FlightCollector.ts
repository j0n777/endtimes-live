import { BaseCollector } from './BaseCollector';
import { MonitorEvent, EventCategory, EventSeverity, ConflictLevel } from '../../types';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface OpenSkyState {
    0: string;  // icao24
    1: string;  // callsign
    2: string;  // origin_country
    3: number;  // time_position
    4: number;  // last_contact
    5: number;  // longitude
    6: number;  // latitude
    7: number;  // baro_altitude
    8: boolean; // on_ground
    9: number;  // velocity
    10: number; // true_track (heading)
    11: number; // vertical_rate
    12: number[]; // sensors
    13: number; // geo_altitude
    14: string; // squawk
    15: boolean; // spi
    16: number; // position_source
}

export class FlightCollector extends BaseCollector {
    // OpenSky has strict rate limits for anon users. 
    // We will target specific "Hot Zones" rather than global to save bandwidth and stay under radar.
    // ZONES: Ukraine/Russia border, Israel/Middle East, Taiwan Strait
    private readonly ZONES = [
        { name: 'EAST_EUROPE', latMin: 44, latMax: 56, lonMin: 22, lonMax: 40 },
        { name: 'MIDDLE_EAST', latMin: 25, latMax: 40, lonMin: 30, lonMax: 60 },
        { name: 'TAIWAN_STRAIT', latMin: 20, latMax: 30, lonMin: 115, lonMax: 125 }
    ];

    constructor() {
        super({
            name: 'FLIGHT_RADAR',
            description: 'Tracks airborne assets in high-tension zones via OpenSky Network',
            schedule: '*/5 * * * *', // Every 5 minutes (Conservative)
            category: 'TRANSPORT' as EventCategory,
            requiresAPIKey: false,
            cacheDurationSeconds: 300
        });
    }

    async collect(): Promise<MonitorEvent[]> {
        const events: MonitorEvent[] = [];

        for (const zone of this.ZONES) {
            try {
                console.log(`[FlightCollector] Scanning zone: ${zone.name}`);

                // OpenSky API (Anonymous)
                const url = `https://opensky-network.org/api/states/all?lamin=${zone.latMin}&lamin=${zone.latMin}&lamax=${zone.latMax}&lomin=${zone.lonMin}&lomax=${zone.lonMax}`;

                const response = await axios.get(url, { timeout: 10000 });

                if (response.data && response.data.states) {
                    const rawStates: OpenSkyState[] = response.data.states;

                    // Filter for interesting aircraft (High altitude or high speed = potentially military or commercial, exclude small cessnas if possible by velocity?)
                    // actually just take a sample to avoid clutter
                    const interestingFlights = rawStates
                        .filter(s => !s[8] && s[9] > 100) // Not on ground, velocity > 100m/s
                        .slice(0, 15); // Limit per zone to avoid map spam

                    for (const state of interestingFlights) {
                        const callsign = state[1].trim() || 'UNKNOWN';
                        const country = state[2];
                        const lat = state[6];
                        const lon = state[5];
                        const heading = state[10];
                        const velocity = Math.round(state[9] * 3.6); // m/s to km/h
                        const alt = Math.round(state[7]);

                        if (!lat || !lon) continue;

                        const event: MonitorEvent = {
                            id: `flight-${state[0]}-${Math.floor(Date.now() / 60000)}`, // Unique per minute
                            title: `AIR TRAFFIC: ${callsign}`,
                            description: `Aircraft detected. Origin: ${country}. Altitude: ${alt}m. Speed: ${velocity}km/h.`,
                            category: 'TRANSPORT' as EventCategory, // Ensure this exists in types or cast
                            severity: 'LOW',
                            conflictLevel: ConflictLevel.PEACE,
                            coordinates: { lat, lng: lon },
                            timestamp: new Date().toISOString(),
                            sourceName: 'OpenSky Network',
                            sourceUrl: `https://opensky-network.org/aircraft-profile?icao24=${state[0]}`,
                            // Store heading in metadata implicitly or use customized description
                            // We'll trust the map to parse description or we can add a custom field if we extend type.
                            // For now, let's put heading in the description for the popup
                            location: `${zone.name} SECTOR`
                        };

                        // HACK: Attach custom data for Map renderer
                        (event as any).heading = heading;
                        (event as any).velocity = velocity;
                        (event as any).callsign = callsign;

                        events.push(event);
                    }
                }
            } catch (error) {
                console.warn(`[FlightCollector] Failed to fetch zone ${zone.name}:`, error instanceof Error ? error.message : String(error));

                // FALLBACK: Simulation Mode (Generates realistic traffic if API blocks/fails)
                console.log(`[FlightCollector] Activating Simulation Mode for ${zone.name}`);
                const mockEvents = this.generateMockEvents(zone);
                events.push(...mockEvents);
            }

            // Sleep structure to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));
        }

        return events;
    }

    private generateMockEvents(zone: { name: string, latMin: number, latMax: number, lonMin: number, lonMax: number }): MonitorEvent[] {
        const count = 3 + Math.floor(Math.random() * 4); // 3-6 planes
        const mocks: MonitorEvent[] = [];
        const prefix = zone.name.substring(0, 2);

        for (let i = 0; i < count; i++) {
            const lat = zone.latMin + Math.random() * (zone.latMax - zone.latMin);
            const lon = zone.lonMin + Math.random() * (zone.lonMax - zone.lonMin);
            const heading = Math.floor(Math.random() * 360);
            const velocity = 400 + Math.floor(Math.random() * 500); // 400-900 km/h
            const alt = 8000 + Math.floor(Math.random() * 5000); // 8000-13000m

            // Generate tactical callsign
            const callsign = `${['USAF', 'NATO', 'RUSS', 'CN', 'UK'][Math.floor(Math.random() * 5)]}${Math.floor(100 + Math.random() * 900)}`;

            const event: MonitorEvent = {
                id: `sim-flight-${prefix}-${i}-${Math.floor(Date.now() / 60000)}`,
                title: `AIR TRAFFIC: ${callsign} (SIM)`,
                description: `Aircraft detected (Simulated). Origin: UNKNOWN. Altitude: ${alt}m. Speed: ${velocity}km/h.`,
                category: 'TRANSPORT' as EventCategory,
                severity: 'LOW',
                conflictLevel: ConflictLevel.PEACE,
                coordinates: { lat, lng: lon },
                timestamp: new Date().toISOString(),
                sourceName: 'OpenSky Network (Sim)',
                sourceUrl: 'https://opensky-network.org',
                location: `${zone.name} SECTOR`
            };

            (event as any).heading = heading;
            (event as any).velocity = velocity;
            (event as any).callsign = callsign;

            mocks.push(event);
        }
        return mocks;
    }
}
