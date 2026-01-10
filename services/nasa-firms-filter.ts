// NASA FIRMS Intelligent Filter
// Filters out non-wildfire thermal anomalies using multiple criteria

export interface FireCoordinates {
    lat: number;
    lng: number;
}

export interface StaticThermalRegion {
    name: string;
    lat: number;
    lng: number;
    radius: number; // km
    type: 'industrial' | 'volcanic';
}

// Static Thermal Anomalies (STA) - Known non-wildfire heat sources
// Based on NASA FIRMS STA mask data
export const STATIC_THERMAL_ANOMALIES: StaticThermalRegion[] = [
    // Industrial - Oil fields, refineries, gas flares
    { name: 'Kuwait Oil Fields', lat: 29.5, lng: 47.7, radius: 50, type: 'industrial' },
    { name: 'Burgan Oil Field', lat: 29.1, lng: 48.0, radius: 30, type: 'industrial' },
    { name: 'Dubai Refineries', lat: 25.0, lng: 55.2, radius: 30, type: 'industrial' },
    { name: 'Saudi Aramco', lat: 26.4, lng: 50.1, radius: 40, type: 'industrial' },
    { name: 'Nigeria Delta', lat: 4.8, lng: 6.5, radius: 80, type: 'industrial' },
    { name: 'Venezuela Oil Belt', lat: 8.2, lng: -64.8, radius: 60, type: 'industrial' },
    { name: 'Texas Oil Fields', lat: 31.8, lng: -102.4, radius: 50, type: 'industrial' },
    { name: 'Siberia Gas Flares', lat: 61.0, lng: 69.0, radius: 100, type: 'industrial' },
    { name: 'Iraq Oil Fields', lat: 30.5, lng: 47.8, radius: 60, type: 'industrial' },
    { name: 'Iran Oil Fields', lat: 31.3, lng: 49.1, radius: 50, type: 'industrial' },

    // Volcanic - Active volcanoes
    { name: 'Mt. Agung (Bali)', lat: -8.34, lng: 115.51, radius: 20, type: 'volcanic' },
    { name: 'Mt. Etna (Sicily)', lat: 37.75, lng: 14.99, radius: 25, type: 'volcanic' },
    { name: 'Kilauea (Hawaii)', lat: 19.42, lng: -155.29, radius: 30, type: 'volcanic' },
    { name: 'Nyiragongo (Congo)', lat: -1.52, lng: 29.25, radius: 20, type: 'volcanic' },
    { name: 'Popocatepetl (Mexico)', lat: 19.02, lng: -98.63, radius: 25, type: 'volcanic' },
    { name: 'Mt. Merapi (Indonesia)', lat: -7.54, lng: 110.44, radius: 20, type: 'volcanic' },
    { name: 'Erebus (Antarctica)', lat: -77.53, lng: 167.17, radius: 30, type: 'volcanic' },
    { name: 'Sakurajima (Japan)', lat: 31.58, lng: 130.66, radius: 20, type: 'volcanic' },
];

// Major vegetation/forest regions (simplified bounding boxes)
export const VEGETATION_REGIONS = [
    // Amazon Rainforest
    { name: 'Amazon', minLat: -15, maxLat: 5, minLng: -80, maxLng: -45 },
    // African Savanna/Forest
    { name: 'Central Africa', minLat: -15, maxLat: 15, minLng: 10, maxLng: 45 },
    // Southeast Asia Forests
    { name: 'SE Asia', minLat: -10, maxLat: 25, minLng: 95, maxLng: 155 },
    // North America Forests
    { name: 'N America', minLat: 25, maxLat: 70, minLng: -170, maxLng: -50 },
    // Australia
    { name: 'Australia', minLat: -45, maxLat: -10, minLng: 110, maxLng: 155 },
    // Siberia/Boreal Forest
    { name: 'Siberia', minLat: 50, maxLat: 75, minLng: 40, maxLng: 180 },
    // Mediterranean
    { name: 'Mediterranean', minLat: 35, maxLat: 45, minLng: -10, maxLng: 40 },
    // South America (other)
    { name: 'S America', minLat: -60, maxLat: -15, minLng: -80, maxLng: -35 },
    // India
    { name: 'India', minLat: 8, maxLat: 35, minLng: 68, maxLng: 97 },
];

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Check if coordinates are in a Static Thermal Anomaly region
 * (industrial sites, volcanoes, etc.)
 */
export function isStaticThermalAnomaly(lat: number, lng: number): boolean {
    for (const region of STATIC_THERMAL_ANOMALIES) {
        const distance = calculateDistance(lat, lng, region.lat, region.lng);
        if (distance < region.radius) {
            console.log(`🚫 Excluded: ${region.name} (${region.type})`);
            return true;
        }
    }
    return false;
}

/**
 * Check if coordinates are in a vegetation/forest area
 * (where wildfires are expected)
 */
export function isVegetationArea(lat: number, lng: number): boolean {
    for (const region of VEGETATION_REGIONS) {
        if (lat >= region.minLat && lat <= region.maxLat &&
            lng >= region.minLng && lng <= region.maxLng) {
            return true;
        }
    }
    return false;
}

/**
 * Check if brightness indicates industrial signature
 * Industrial fires have specific brightness patterns
 */
export function hasIndustrialSignature(brightness: number, frp: number): boolean {
    // Very high brightness + low FRP = likely industrial/gas flare
    if (brightness > 400 && frp < 100) return true;

    // Very low brightness = sensor artifact
    if (brightness < 300) return true;

    return false;
}

/**
 * Comprehensive wildfire filter
 * Returns true if fire is likely a REAL wildfire threat
 */
export function isRelevantWildfire(fire: {
    latitude: number;
    longitude: number;
    frp: number;
    confidence: string;
    brightness: number;
}): boolean {
    // 1. Exclude static thermal anomalies (industrial/volcanic)
    if (isStaticThermalAnomaly(fire.latitude, fire.longitude)) {
        return false;
    }

    // 2. Only vegetation areas (forests, savannas, etc.)
    if (!isVegetationArea(fire.latitude, fire.longitude)) {
        console.log(`🚫 Excluded: Not in vegetation area (${fire.latitude.toFixed(2)}, ${fire.longitude.toFixed(2)})`);
        return false;
    }

    // 3. High confidence only
    if (fire.confidence !== 'h') {
        return false;
    }

    // 4. Intense fires only (FRP > 200 MW)
    if (fire.frp < 200) {
        return false;
    }

    // 5. Exclude industrial signatures
    if (hasIndustrialSignature(fire.brightness, fire.frp)) {
        console.log(`🚫 Excluded: Industrial signature (brightness: ${fire.brightness})`);
        return false;
    }

    return true;
}
