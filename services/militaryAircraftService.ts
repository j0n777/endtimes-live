/**
 * Military Aircraft Live Tracking Service
 *
 * Uses adsb.lol public API (free, no key required, CORS-friendly)
 * specifically designed for military/special-interest aircraft tracking.
 *
 * API docs: https://api.adsb.lol/
 * Data: aggregated ADS-B from community receivers worldwide
 *
 * NOTE: These aircraft positions are NOT stored in the events DB.
 * They appear as a separate live overlay layer on the map.
 */

export interface MilitaryAircraft {
    hex: string;          // ICAO24 transponder hex
    callsign: string;     // Flight callsign (e.g. "FORTE10", "NATO1")
    lat: number;
    lng: number;
    altitude: number;     // feet (baro)
    speed: number;        // knots ground speed
    heading: number;      // degrees true (0-359) for icon rotation
    type: string;         // Aircraft type code (e.g. "B52", "P8", "RC135")
    registration: string; // Tail number / reg
    country: string;      // Country of registration
    isEmergency: boolean; // squawk 7700/7600/7500
}

interface AdsbLolAircraft {
    hex: string;
    flight?: string;        // callsign
    lat?: number;
    lon?: number;
    alt_baro?: number | string; // "ground" or feet
    gs?: number;
    track?: number;         // heading
    t?: string;             // ICAO type code
    r?: string;             // registration
    desc?: string;          // aircraft description
    squawk?: string;
    dbFlags?: number;       // bit 1 = military
    ownOp?: string;         // Operator name
    'yyy'?: number;         // lat (alt field)
}

const ADSBLOL_MIL_URL = 'https://api.adsb.lol/v2/mil';

/**
 * Non-combat military aircraft types to exclude.
 * These are executive transports, VIP jets, basic trainers, and liaison aircraft
 * that appear in military registrations but are not relevant for a conflict monitor.
 *
 * Aircraft with NO type code are ALWAYS included — many combat aircraft don't broadcast type.
 */
const NON_COMBAT_TYPES = new Set([
    // VIP / executive jets (military VIP transport)
    'C560', 'C56X', 'C510', 'C525', 'C25A', 'C25B', 'C25C', // Cessna Citation
    'GLF4', 'GLF5', 'GLF6', 'GL5T', 'GL7T', 'GLEX',           // Gulfstream
    'CL60', 'CL30', 'CL35', 'CL65', 'CL2P',                   // Bombardier Challenger
    'E45X', 'E45S', 'E50P', 'E55P',                            // Embraer Legacy/Praetor
    'LJ35', 'LJ45', 'LJ60', 'LJ75',                            // Learjet
    'F900', 'FA50', 'F2TH', 'DA50',                            // Dassault Falcon (VIP)
    'PC12', 'PC24',                                             // Pilatus (liaison)
    'BE20', 'BE40', 'BE9L',                                     // Beechcraft King Air (liaison)
    'TBM7', 'TBM8', 'TBM9',                                    // TBM (liaison)
    // Basic trainers
    'L39', 'L159',                                              // Aero Vodochody (Czech trainer)
    'PC7', 'PC9', 'PC21',                                       // Pilatus trainers
    'T134', 'T154',                                             // Soviet-era trainers
    'MB339', 'SF26', 'SF260',                                   // Light trainers
    'HAWK', 'T45', 'T6', 'TEX2',                               // Hawk / T-6 Texan / T-6C Texan II trainer
    'T38', 'T38A',                                              // T-38 Talon supersonic trainer (not combat)
    // Light liaison / utility (not combat-relevant)
    'C172', 'C182', 'C206', 'C208',                             // Cessna piston/single
    'PA28', 'PA31', 'PA32', 'PA34',                             // Piper
    'SR20', 'SR22',                                             // Cirrus
    'DA40', 'DA42', 'DA62',                                     // Diamond
    'B350', 'B36T',                                             // Beech Baron/Bonanza
]);

// Countries inferred from registration prefix (common military prefixes)
const CALLSIGN_COUNTRY: Record<string, string> = {
    'RCH': 'USA', 'CFC': 'USA', 'RRR': 'USA', 'ASY': 'USA',
    'FORTE': 'USA', 'SPAR': 'USA', 'AF1': 'USA', 'SAM': 'USA',
    'DUKE': 'USA', 'PEARL': 'USA', 'SKULL': 'USA', 'HAVOC': 'USA',
    'HOMER': 'USA', 'HUNT': 'USA', 'BISON': 'USA', 'WOLF': 'USA',
    'BLADE': 'USA', 'COBRA': 'USA', 'HAWK': 'USA', 'IRON': 'USA',
    'NATO': 'NATO', 'NAEW': 'NATO',
    'ASCOT': 'UK', 'TARTAN': 'UK', 'FLASH': 'UK', 'REACH': 'UK',
    'GAF': 'Germany', 'GERMAN': 'Germany',
    'FAF': 'France', 'FRENCH': 'France', 'COTAM': 'France',
    'ITALY': 'Italy', 'IAM': 'Italy',
    'AERO': 'Russia', 'RFF': 'Russia',
    'CNAF': 'China', 'PLAAF': 'China',
    'IAF': 'Israel',
    'TUAF': 'Turkey',
    'ROKAF': 'South Korea',
    'JASDF': 'Japan',
};

function inferCountry(callsign: string): string {
    for (const [prefix, country] of Object.entries(CALLSIGN_COUNTRY)) {
        if (callsign.toUpperCase().startsWith(prefix)) return country;
    }
    return '';
}

function isEmergencySquawk(squawk?: string): boolean {
    return ['7700', '7600', '7500'].includes(squawk || '');
}

export async function fetchMilitaryAircraft(): Promise<MilitaryAircraft[]> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(ADSBLOL_MIL_URL, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.warn(`[MilAircraft] adsb.lol returned ${response.status}`);
            return [];
        }

        const data = await response.json();
        // API returns { ac: AircraftArray[], ... }
        const aircraftList: AdsbLolAircraft[] = data?.ac || [];

        const result: MilitaryAircraft[] = [];

        for (const ac of aircraftList) {
            // Must have valid coordinates
            if (!ac.lat || !ac.lon) continue;
            // Skip ground traffic
            const alt = typeof ac.alt_baro === 'number' ? ac.alt_baro : 0;
            if (typeof ac.alt_baro === 'string' && ac.alt_baro === 'ground') continue;
            if (alt < 50) continue; // skip if too low (taxiing / error)

            // Combat-type filter: if type code is known and it's a non-combat aircraft → skip.
            // Aircraft with no type code are always included (many combat types don't broadcast type).
            const typeCode = (ac.t || '').toUpperCase().trim();
            if (typeCode && NON_COMBAT_TYPES.has(typeCode)) continue;

            const callsign = (ac.flight || ac.hex || '').trim();
            const isEmergency = isEmergencySquawk(ac.squawk);

            result.push({
                hex: ac.hex,
                callsign: callsign || ac.hex,
                lat: ac.lat,
                lng: ac.lon,
                altitude: Math.round(alt),
                speed: Math.round(ac.gs || 0),
                heading: Math.round(ac.track || 0),
                type: ac.t || '',
                registration: ac.r || '',
                country: inferCountry(callsign),
                isEmergency,
            });
        }

        return result;

    } catch (e) {
        if ((e as Error).name !== 'AbortError') {
            console.warn('[MilAircraft] Fetch failed:', e);
        }
        return [];
    }
}
