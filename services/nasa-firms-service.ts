import { MonitorEvent, EventCategory, Severity } from '../types';

const NASA_FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

interface FIRMSFire {
    latitude: number;
    longitude: number;
    brightness: number;
    scan: number;
    track: number;
    acq_date: string;
    acq_time: string;
    satellite: string;
    confidence: string;
    version: string;
    bright_t31: number;
    frp: number; // Fire Radiative Power
    daynight: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const parseCSV = (csvText: string): FIRMSFire[] => {
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
            scan: parseFloat(fire.scan),
            track: parseFloat(fire.track),
            acq_date: fire.acq_date,
            acq_time: fire.acq_time,
            satellite: fire.satellite,
            confidence: fire.confidence,
            version: fire.version,
            bright_t31: parseFloat(fire.bright_t31),
            frp: parseFloat(fire.frp),
            daynight: fire.daynight,
        });
    }

    return fires;
};

const determineSeverity = (frp: number, confidence: string): Severity => {
    // Fire Radiative Power indicates fire intensity
    if (frp > 100 || confidence === 'h') return 'HIGH';
    if (frp > 50 || confidence === 'n') return 'ELEVATED';
    return 'MEDIUM';
};

const getLocationName = (lat: number, lng: number): string => {
    // Simple region naming based on coordinates
    if (lat > 35 && lng > -125 && lng < -65) return 'North America';
    if (lat > 25 && lat < 50 && lng > -10 && lng < 40) return 'Mediterranean/Middle East';
    if (lat < 10 && lat > -35 && lng > -80 && lng < -30) return 'South America';
    if (lat > -35 && lat < 40 && lng > -20 && lng < 55) return 'Africa';
    if (lat > -50 && lat < 60 && lng > 60 && lng < 180) return 'Asia/Pacific';
    if (lat > 40 && lng > -10 && lng < 40) return 'Europe';

    return 'Global';
};

export const fetchNASAFIRMSEvents = async (apiKey: string): Promise<MonitorEvent[]> => {
    if (!apiKey) {
        throw new Error('NASA FIRMS requires an API key');
    }

    try {
        // Fetch global fires from last 7 days
        // Using VIIRS data source (more recent satellite)
        const source = 'VIIRS_NOAA20_NRT';
        const dayRange = 7;

        // World bounds
        const area = '-180,-90,180,90'; // west,south,east,north

        const url = `${NASA_FIRMS_BASE_URL}/${apiKey}/${source}/${area}/${dayRange}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NASA FIRMS API error: ${response.status}`);
        }

        const csvText = await response.text();
        const fires = parseCSV(csvText);

        // Filter and sort by Fire Radiative Power (intensity)
        // Keep only HIGH intensity fires (FRP > 50) to reduce noise
        const significantFires = fires
            .filter(fire => fire.frp > 50 && fire.confidence !== 'l') // High intensity + good confidence
            .sort((a, b) => b.frp - a.frp) // Sort by intensity (highest first)
            .slice(0, 100); // Top 100 most intense fires

        return significantFires.map(fire => {
            const dateTime = `${fire.acq_date} ${fire.acq_time}`;
            const location = getLocationName(fire.latitude, fire.longitude);

            return {
                id: generateId(),
                title: `Active Fire Detected (FRP: ${fire.frp.toFixed(1)} MW)`,
                description: `Satellite: ${fire.satellite} | Confidence: ${fire.confidence.toUpperCase()} | Brightness: ${fire.brightness}K | Time: ${fire.daynight === 'D' ? 'Day' : 'Night'}`,
                category: EventCategory.FIRES,
                severity: determineSeverity(fire.frp, fire.confidence),
                sourceType: 'OFFICIAL' as const,
                sourceName: 'NASA FIRMS',
                location,
                coordinates: {
                    lat: fire.latitude,
                    lng: fire.longitude,
                },
                timestamp: new Date(`${fire.acq_date}T${fire.acq_time.padStart(4, '0').slice(0, 2)}:${fire.acq_time.padStart(4, '0').slice(2)}:00Z`).toISOString(),
                sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/map/',
            };
        });
    } catch (error) {
        console.error('NASA FIRMS fetch error:', error);
        throw error;
    }
};
