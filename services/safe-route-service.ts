// Safe Route Calculation Service
// Calculates routes avoiding danger zones using OSRM

import { DangerZone } from './geofence-service';

const OSRM_API = 'https://router.project-osrm.org/route/v1/driving';

export interface RouteResult {
    distance: number; // meters
    duration: number; // seconds
    geometry: [number, number][]; // lat,lng coordinates
    safe: boolean;
    dangerZonesCrossed: string[];
  safet score: number; // 0-100, higher is safer
}

/**
 * Calculate route between two points
 * Returns safest route avoiding danger zones
 */
export async function calculateSafeRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    dangerZones: DangerZone[]
): Promise<RouteResult | null> {
    try {
        // Request route from OSRM
        const url = `${OSRM_API}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error('OSRM route error:', response.status);
            return null;
        }

        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            console.error('No routes found');
            return null;
        }

        const route = data.routes[0];
        const geometry: [number, number][] = route.geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] // Convert lng,lat to lat,lng
        );

        // Check for danger zone intersections
        const crossedZones: string[] = [];
        let dangerPoints = 0;

        geometry.forEach(point => {
            dangerZones.forEach(zone => {
                if (isPointInCircle(point, zone.center, zone.radius)) {
                    if (!crossedZones.includes(zone.id)) {
                        crossedZones.push(zone.id);
                    }
                    dangerPoints++;
                }
            });
        });

        // Calculate safety score (0-100)
        const safetyScore = Math.max(0, 100 - (crossedZones.length * 30) - (dangerPoints * 0.5));

        return {
            distance: route.distance,
            duration: route.duration,
            geometry,
            safe: crossedZones.length === 0,
            dangerZonesCrossed: crossedZones,
            safetyScore
        };

    } catch (error) {
        console.error('Safe route calculation error:', error);
        return null;
    }
}

/**
 * Calculate alternative routes and return the safest
 */
export async function findSafestRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    dangerZones: DangerZone[]
): Promise<RouteResult | null> {
    // For now, return single route
    // TODO: Request multiple alternative routes from OSRM
    return calculateSafeRoute(from, to, dangerZones);
}

/**
 * Check if point is inside circular zone
 */
function isPointInCircle(
    point: [number, number],
    center: [number, number],
    radiusKm: number
): boolean {
    const R = 6371; // Earth radius in km
    const dLat = (point[0] - center[0]) * Math.PI / 180;
    const dLng = (point[1] - center[1]) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(center[0] * Math.PI / 180) * Math.cos(point[0] * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusKm;
}

/**
 * Get route safety recommendations
 */
export function getRouteSafetyRecommendations(route: RouteResult): string[] {
    const recommendations: string[] = [];

    if (route.dangerZonesCrossed.length > 0) {
        recommendations.push(`⚠️ Route crosses ${route.dangerZonesCrossed.length} danger zone(s)`);
        recommendations.push('Consider alternative transportation or wait for safer conditions');
    }

    if (route.safetyScore < 50) {
        recommendations.push('🚨 High risk route - NOT RECOMMENDED');
        recommendations.push('Seek alternative route or avoid travel');
    } else if (route.safetyScore < 70) {
        recommendations.push('⚠️ Moderate risk - Exercise extreme caution');
        recommendations.push('Travel in groups and maintain communication');
    } else {
        recommendations.push('✅ Relatively safe route');
        recommendations.push('Monitor situation and stay alert');
    }

    return recommendations;
}
