/**
 * SolarAlertCollector — tracks solar flares, CMEs, and geomagnetic storms
 *
 * Data sources (all free, no API key required):
 * - NOAA SWPC: https://services.swpc.noaa.gov/  (primary — real-time, no key)
 * - NASA DONKI: https://api.nasa.gov/DONKI/      (secondary — 7-day history, DEMO_KEY)
 *
 * Event classification:
 *   X-class flare → CRITICAL (major risk to satellites, GPS, radio, power grids)
 *   M-class flare → HIGH     (moderate to strong disruption)
 *   C-class flare → ELEVATED (minor disruption, watch)
 *   B/A class     → MEDIUM   (very weak, informational)
 *
 * Coordinates: Solar events are global in nature.
 * We place the pin at (0, 0) with location "Global · Solar Event" so it
 * appears as a distinct marker on the world map. For geomagnetic storms,
 * the poles are most affected — a future enhancement could show polar coords.
 */

import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

// NOAA SWPC public endpoints (no auth)
const NOAA_XRAY_FLARES_URL = 'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-7-day.json';
const NOAA_GEOMAG_STORM_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
const NASA_DONKI_FLR_URL = 'https://api.nasa.gov/DONKI/FLR?api_key=DEMO_KEY';

// Solar coordinates — symbolic: slightly off zero to bypass BaseCollector auto-geocoder (0,0 triggers it).
// We use the sub-solar point on the equator (+0.1° offset) as a global marker for solar flares,
// and the geomagnetic north pole for geomagnetic storms.
const SOLAR_COORDS = { lat: 0.1, lng: 0 };           // Equatorial solar event marker
const GEOMAG_NORTH_COORDS = { lat: 78.3, lng: -72.6 }; // Geomagnetic north pole (aurora zone)

interface NoaaFlare {
    begin_time: string;
    max_time: string;       // peak time (field is "max_time" in NOAA API)
    end_time: string;
    max_class: string;      // peak class e.g. "X3.4", "M1.2", "C5.6" (field is "max_class")
    begin_class?: string;   // starting class
    end_class?: string;     // ending class
    location?: string;      // e.g. "N10W30"
    satellite?: number;
}

interface NasaFlare {
    flrID: string;
    beginTime: string;
    peakTime: string;
    endTime: string;
    classType: string;     // e.g. "X1.5"
    sourceLocation?: string;
    note?: string;
}

function classToSeverity(flareClass: string): Severity {
    const c = (flareClass || '').toUpperCase().trim();
    if (c.startsWith('X')) return 'CRITICAL';
    if (c.startsWith('M')) return 'HIGH';
    if (c.startsWith('C')) return 'ELEVATED';
    return 'MEDIUM';
}

function classToLabel(flareClass: string): string {
    const c = (flareClass || '').toUpperCase().trim();
    if (c.startsWith('X')) return `X-class Solar Flare (${c})`;
    if (c.startsWith('M')) return `M-class Solar Flare (${c})`;
    if (c.startsWith('C')) return `C-class Solar Flare (${c})`;
    return `Solar Flare (${c})`;
}

export class SolarAlertCollector extends BaseCollector {

    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'SOLAR_ALERTS',
            cacheDurationSeconds: 1800,      // 30 min (NOAA updates every ~5 min)
            rateLimitPerMinute: 5,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 1800
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const events: MonitorEvent[] = [];

        // --- Source 1: NOAA SWPC Solar Flares (7-day) ---
        try {
            const resp = await fetch(NOAA_XRAY_FLARES_URL, {
                signal: AbortSignal.timeout(15000),
                headers: { 'Accept': 'application/json' }
            });
            if (resp.ok) {
                const flares: NoaaFlare[] = await resp.json();
                const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

                // Tiered cutoffs: X/M = 7 days, C5+ = 24h, below C5 = skip
                const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

                for (const flare of (flares || [])) {
                    // NOAA API uses max_class (peak class) and max_time (peak time)
                    const flareClass = (flare.max_class || '').trim();
                    if (!flareClass || !flare.max_time) continue;

                    const upper = flareClass.toUpperCase();
                    const peakTime = flare.max_time.endsWith('Z') ? flare.max_time : flare.max_time + 'Z';

                    // X-class and M-class: 7-day window (always significant)
                    if (upper.startsWith('X') || upper.startsWith('M')) {
                        if (peakTime < cutoff) continue;
                    }
                    // C-class: only C5.0 and above, and only last 24h
                    else if (upper.startsWith('C')) {
                        const cStrength = parseFloat(upper.substring(1)); // e.g. "5.3" from "C5.3"
                        if (isNaN(cStrength) || cStrength < 5.0) continue; // skip C1–C4
                        if (peakTime < cutoff24h) continue;                 // skip if older than 24h
                    }
                    // B/A class and anything else: skip entirely
                    else continue;

                    const severity = classToSeverity(flareClass);
                    const label = classToLabel(flareClass);
                    const regionStr = flare.location ? ` from region ${flare.location}` : '';
                    const description = `Solar flare of class ${flareClass}${regionStr} detected by NOAA GOES satellite. Peak: ${flare.max_time} UTC. ${severity === 'CRITICAL' ? 'May cause radio blackouts, GPS disruption, and power grid stress.' : severity === 'HIGH' ? 'May cause HF radio disruption and elevated radiation near poles.' : 'Minor radio disruption possible at high latitudes.'}`;

                    events.push({
                        id: `solar_noaa_${flare.begin_time}_${flareClass}`.replace(/[\s:T]/g, '_'),
                        title: `☀ ${label} — NOAA SWPC`,
                        description,
                        category: EventCategory.SOLAR_ALERT,
                        severity,
                        sourceType: 'RSS',
                        sourceName: 'NOAA Space Weather',
                        sourceUrl: 'https://www.swpc.noaa.gov/products/goes-x-ray-flux',
                        timestamp: peakTime,
                        location: 'Global · Solar Event',
                        coordinates: SOLAR_COORDS,
                    });
                }
            }
        } catch (e) {
            console.warn('[SolarAlerts] NOAA fetch failed:', e instanceof Error ? e.message : String(e));
        }

        // --- Source 2: NOAA Geomagnetic K-index (storms) ---
        try {
            const resp = await fetch(NOAA_GEOMAG_STORM_URL, {
                signal: AbortSignal.timeout(10000),
                headers: { 'Accept': 'application/json' }
            });
            if (resp.ok) {
                const rawData: string[][] = await resp.json();
                // First row is header: ['time_tag', 'Kp', ...]
                // Find entries with Kp >= 5 (minor storm) in last 24h
                const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16);

                for (const row of (rawData || []).slice(1)) {
                    const [timeTag, kpStr] = row;
                    if (!timeTag || !kpStr || timeTag < cutoff) continue;

                    const kp = parseFloat(kpStr);
                    if (isNaN(kp) || kp < 5) continue; // Only G1 and above (Kp >= 5)

                    let severity: Severity;
                    let stormLevel: string;
                    if (kp >= 9) { severity = 'CRITICAL'; stormLevel = 'G5 (Extreme)'; }
                    else if (kp >= 8) { severity = 'HIGH'; stormLevel = 'G4 (Severe)'; }
                    else if (kp >= 7) { severity = 'HIGH'; stormLevel = 'G3 (Strong)'; }
                    else if (kp >= 6) { severity = 'ELEVATED'; stormLevel = 'G2 (Moderate)'; }
                    else { severity = 'MEDIUM'; stormLevel = 'G1 (Minor)'; }

                    const description = `Geomagnetic storm reaching Kp=${kp} (${stormLevel}) detected. Effects: aurora visible at mid-latitudes${kp >= 7 ? ', HF radio disruption, power grid fluctuations' : ''}${kp >= 9 ? ', widespread blackouts possible' : ''}.`;

                    events.push({
                        id: `solar_kp_${timeTag.replace(/[\s:]/g, '_')}_${kp}`,
                        title: `🌍 Geomagnetic Storm ${stormLevel} — Kp=${kp}`,
                        description,
                        category: EventCategory.SOLAR_ALERT,
                        severity,
                        sourceType: 'RSS',
                        sourceName: 'NOAA Space Weather',
                        sourceUrl: 'https://www.swpc.noaa.gov/products/planetary-k-index',
                        timestamp: new Date(timeTag.trim() + ':00Z').toISOString(),
                        location: 'Global · Geomagnetic Storm',
                        coordinates: GEOMAG_NORTH_COORDS,
                    });
                }
            }
        } catch (e) {
            console.warn('[SolarAlerts] NOAA K-index fetch failed:', e instanceof Error ? e.message : String(e));
        }

        // Deduplicate: keep the strongest flare class per calendar day.
        // Sort descending by severity so X beats M beats C when deduping per day.
        const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 4, HIGH: 3, ELEVATED: 2, MEDIUM: 1 };
        events.sort((a, b) => (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0));

        const seenDay = new Set<string>();
        const unique = events.filter(e => {
            const day = e.timestamp.substring(0, 10); // YYYY-MM-DD
            // For X-class, always include (no dedup — they're rare and critical)
            if (e.title.includes('X-class')) return true;
            const key = `${e.title.split('(')[0].trim()}|${day}`; // class prefix + day
            if (seenDay.has(key)) return false;
            seenDay.add(key);
            return true;
        });

        console.log(`☀ SolarAlerts: Collected ${unique.length} events`);
        return unique;
    }
}
