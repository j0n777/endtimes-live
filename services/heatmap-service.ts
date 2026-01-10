// Resource Density Heat Map Service
// Creates heat maps showing concentration of survival resources

import L from 'leaflet';
import 'leaflet.heat'; // Heat map plugin

export interface HeatMapPoint {
    lat: number;
    lng: number;
    intensity: number; // 0.0 - 1.0
}

/**
 * Generate heat map data from POIs/events
 * @param events - Events or POIs to visualize
 * @param category - Filter by category (optional)
 */
export function generateHeatMapData(
    events: Array<{ coordinates: { lat: number; lng: number }; category?: string }>,
    category?: string
): HeatMapPoint[] {
    let filtered = events;

    if (category) {
        filtered = events.filter(e => e.category === category);
    }

    return filtered.map(event => ({
        lat: event.coordinates.lat,
        lng: event.coordinates.lng,
        intensity: 1.0
    }));
}

/**
 * Create Leaflet heat map layer
 * @param map - Leaflet map instance
 * @param points - Heat map points
 * @param options - Heat map configuration
 */
export function createHeatMapLayer(
    map: L.Map,
    points: HeatMapPoint[],
    options?: {
        radius?: number;
        blur?: number;
        maxZoom?: number;
        max?: number;
        gradient?: { [key: number]: string };
    }
): L.HeatLayer | null {
    // Check if leaflet.heat is loaded
    if (!(L as any).heatLayer) {
        console.error('Leaflet.heat plugin not loaded');
        return null;
    }

    const defaultOptions = {
        radius: 25,
        blur: 15,
        maxZoom: 12,
        max: 1.0,
        gradient: {
            0.0: 'blue',
            0.25: 'cyan',
            0.5: 'lime',
            0.75: 'yellow',
            1.0: 'red'
        },
        ...options
    };

    // Convert to format expected by leaflet.heat
    const heatData: [number, number, number][] = points.map(p => [
        p.lat,
        p.lng,
        p.intensity
    ]);

    const heatLayer = (L as any).heatLayer(heatData, defaultOptions);
    heatLayer.addTo(map);

    return heatLayer;
}

/**
 * Create resource density heat maps for different categories
 */
export interface ResourceHeatMaps {
    food: L.HeatLayer | null;
    water: L.HeatLayer | null;
    medical: L.HeatLayer | null;
    shelter: L.HeatLayer | null;
}

export function createResourceHeatMaps(
    map: L.Map,
    pois: Array<{ coordinates: { lat: number; lng: number }; metadata?: { poiType?: string } }>
): ResourceHeatMaps {
    const categories = {
        food: pois.filter(p => p.metadata?.poiType === 'FOOD'),
        water: pois.filter(p => p.metadata?.poiType === 'WATER'),
        medical: pois.filter(p => p.metadata?.poiType === 'MEDICAL'),
        shelter: pois.filter(p => p.metadata?.poiType === 'SHELTER')
    };

    return {
        food: categories.food.length > 0
            ? createHeatMapLayer(map, generateHeatMapData(categories.food), {
                gradient: { 0.0: 'darkblue', 0.5: 'blue', 1.0: 'yellow' }
            })
            : null,
        water: categories.water.length > 0
            ? createHeatMapLayer(map, generateHeatMapData(categories.water), {
                gradient: { 0.0: 'darkblue', 0.5: 'cyan', 1.0: 'white' }
            })
            : null,
        medical: categories.medical.length > 0
            ? createHeatMapLayer(map, generateHeatMapData(categories.medical), {
                gradient: { 0.0: 'darkgreen', 0.5: 'green', 1.0: 'red' }
            })
            : null,
        shelter: categories.shelter.length > 0
            ? createHeatMapLayer(map, generateHeatMapData(categories.shelter), {
                gradient: { 0.0: 'purple', 0.5: 'magenta', 1.0: 'white' }
            })
            : null
    };
}

/**
 * Toggle heat map visibility
 */
export function toggleHeatMap(heatLayer: L.HeatLayer | null, map: L.Map, visible: boolean) {
    if (!heatLayer) return;

    if (visible) {
        heatLayer.addTo(map);
    } else {
        map.removeLayer(heatLayer);
    }
}

/**
 * Create danger zone heat map (intensity = severity)
 */
export function createDangerHeatMap(
    map: L.Map,
    dangerZones: Array<{ center: [number, number]; severity: string }>
): L.HeatLayer | null {
    const severityMap: { [key: string]: number } = {
        'HIGH': 1.0,
        'ELEVATED': 0.7,
        'MEDIUM': 0.4,
        'LOW': 0.2
    };

    const points: HeatMapPoint[] = dangerZones.map(zone => ({
        lat: zone.center[0],
        lng: zone.center[1],
        intensity: severityMap[zone.severity] || 0.5
    }));

    return createHeatMapLayer(map, points, {
        radius: 50,
        blur: 25,
        gradient: {
            0.0: 'green',
            0.3: 'yellow',
            0.6: 'orange',
            0.8: 'red',
            1.0: 'darkred'
        }
    });
}
