// OpenStreetMap POI (Points of Interest) Service
// Fetches survival resources from OSM Overpass API

import { MonitorEvent, EventCategory, Severity } from '../types';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

export interface POI {
    id: string;
    name: string;
    type: string;
    category: 'SHELTER' | 'FOOD' | 'WATER' | 'MEDICAL' | 'SECURITY' | 'BUNKER';
    coordinates: { lat: number; lng: number };
}

// POI queries for survival resources
const SURVIVAL_QUERIES = {
    SHELTER: '["amenity"~"place_of_worship|community_centre"]',
    FOOD: '["shop"~"supermarket|convenience|farm"]',
    WATER: '["natural"="spring"]["amenity"="drinking_water"]["man_made"~"water_well|water_tower"]',
    MEDICAL: '["amenity"~"hospital|clinic|pharmacy|doctors"]',
    SECURITY: '["amenity"~"police|fire_station"]',
    BUNKER: '["military"="bunker"]["emergency"="shelter"]'
};

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Fetch POIs from OpenStreetMap Overpass API within bounding box
 * @param bounds - { south, west, north, east }
 * @param categories - Array of categories to fetch
 */
export const fetchOSMPOIs = async (
    bounds: { south: number; west: number; north: number; east: number },
    categories: Array<keyof typeof SURVIVAL_QUERIES> = ['SHELTER', 'FOOD', 'WATER', 'MEDICAL']
): Promise<MonitorEvent[]> => {
    try {
        const { south, west, north, east } = bounds;
        const bbox = `${south},${west},${north},${east}`;

        // Build Overpass QL query for selected categories
        const categoryQueries = categories.map(cat => {
            return `node${SURVIVAL_QUERIES[cat]}(${bbox});`;
        }).join('\n');

        const query = `
      [out:json][timeout:25];
      (
        ${categoryQueries}
      );
      out body;
      >;
      out skel qt;
    `;

        const response = await fetch(OVERPASS_API, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!response.ok) {
            console.error(`Overpass API error: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // Parse OSM elements to MonitorEvents
        return data.elements
            .filter((el: any) => el.lat && el.lon)
            .map((el: any) => {
                const category = getCategoryFromTags(el.tags);
                const name = el.tags.name || `${category} Resource`;

                return {
                    id: generateId(),
                    title: `${getCategoryIcon(category)} ${name}`,
                    description: getCategoryDescription(category, el.tags),
                    category: EventCategory.PROPHETIC, // Use different category for POIs
                    severity: 'MEDIUM' as Severity,
                    sourceType: 'OFFICIAL' as const,
                    sourceName: 'OpenStreetMap',
                    location: el.tags['addr:city'] || 'Unknown',
                    coordinates: {
                        lat: el.lat,
                        lng: el.lon
                    },
                    timestamp: new Date().toISOString(),
                    sourceUrl: `https://www.openstreetmap.org/node/${el.id}`,
                    metadata: {
                        poiType: category,
                        osmId: el.id,
                        tags: el.tags
                    }
                };
            });

    } catch (error) {
        console.error('OSM POI fetch error:', error);
        return [];
    }
};

/**
 * Determine POI category from OSM tags
 */
function getCategoryFromTags(tags: any): string {
    if (tags.amenity === 'place_of_worship' || tags.amenity === 'community_centre') return 'SHELTER';
    if (tags.shop) return 'FOOD';
    if (tags.natural === 'spring' || tags.amenity === 'drinking_water' || tags.man_made === 'water_well') return 'WATER';
    if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'pharmacy') return 'MEDICAL';
    if (tags.amenity === 'police' || tags.amenity === 'fire_station') return 'SECURITY';
    if (tags.military === 'bunker' || tags.emergency === 'shelter') return 'BUNKER';
    return 'UNKNOWN';
}

/**
 * Get icon for POI category
 */
function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        'SHELTER': '⛪',
        'FOOD': '🏪',
        'WATER': '💧',
        'MEDICAL': '🏥',
        'SECURITY': '🛡️',
        'BUNKER': '🏰'
    };
    return icons[category] || '📍';
}

/**
 * Generate description from OSM tags
 */
function getCategoryDescription(category: string, tags: any): string {
    const base = `Category: ${category}`;
    const details: string[] = [base];

    if (tags.opening_hours) details.push(`Hours: ${tags.opening_hours}`);
    if (tags.phone) details.push(`Phone: ${tags.phone}`);
    if (tags['addr:street']) details.push(`Address: ${tags['addr:street']}`);
    if (tags.capacity) details.push(`Capacity: ${tags.capacity}`);

    return details.join(' | ');
}

/**
 * Get curated POIs for major cities (fallback when Overpass slow)
 */
export const getCuratedPOIs = (): MonitorEvent[] => {
    // Curated survival POIs for major cities
    const curated = [
        {
            name: 'Cathedral Shelter - NYC',
            category: 'SHELTER',
            lat: 40.7489,
            lng: -73.9680
        },
        {
            name: 'Emergency Water Well - LA',
            category: 'WATER',
            lat: 34.0522,
            lng: -118.2437
        },
        // Add more curated POIs as needed
    ];

    return curated.map(poi => ({
        id: generateId(),
        title: `${getCategoryIcon(poi.category)} ${poi.name}`,
        description: `Curated survival resource - ${poi.category}`,
        category: EventCategory.PROPHETIC,
        severity: 'MEDIUM' as Severity,
        sourceType: 'COMMUNITY' as const,
        sourceName: 'Curated POIs',
        location: poi.name.split(' - ')[1] || 'Unknown',
        coordinates: { lat: poi.lat, lng: poi.lng },
        timestamp: new Date().toISOString(),
        sourceUrl: 'https://www.openstreetmap.org',
        metadata: { poiType: poi.category }
    }));
};
