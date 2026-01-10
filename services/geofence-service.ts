// Danger Zone Geofences Service
// Creates zones around high-risk areas for situational awareness

import L from 'leaflet';
import { MonitorEvent, Severity } from '../types';

export interface DangerZone {
    id: string;
    name: string;
    center: [number, number];
    radius: number; // kilometers
    severity: Severity;
    reason: string;
    color: string;
    events: string[]; // Event IDs within this zone
}

/**
 * Generate danger zones from high-severity events
 * Groups nearby events into geofenced areas
 */
export function generateDangerZones(events: MonitorEvent[]): DangerZone[] {
    const zones: DangerZone[] = [];

    // Filter HIGH and STATE_WAR severity events
    const criticalEvents = events.filter(e =>
        e.severity === 'HIGH' || e.conflictLevel === 'STATE_WAR'
    );

    // Group events by proximity (within 100km)
    const processed = new Set<string>();

    criticalEvents.forEach(event => {
        if (processed.has(event.id)) return;

        // Find nearby events
        const nearby = criticalEvents.filter(e => {
            if (processed.has(e.id)) return false;
            const distance = calculateDistance(
                event.coordinates.lat,
                event.coordinates.lng,
                e.coordinates.lat,
                e.coordinates.lng
            );
            return distance < 100; // 100km radius
        });

        if (nearby.length > 0) {
            // Create zone
            const centerLat = nearby.reduce((sum, e) => sum + e.coordinates.lat, 0) / nearby.length;
            const centerLng = nearby.reduce((sum, e) => sum + e.coordinates.lng, 0) / nearby.length;

            zones.push({
                id: `zone-${zones.length}`,
                name: `Danger Zone: ${event.location}`,
                center: [centerLat, centerLng],
                radius: 80, // km
                severity: 'HIGH',
                reason: `${nearby.length} critical events clustered`,
                color: '#ff0000',
                events: nearby.map(e => e.id)
            });

            // Mark as processed
            nearby.forEach(e => processed.add(e.id));
        }
    });

    return zones;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
 * Render danger zones on Leaflet map
 */
export function renderDangerZones(map: L.Map, zones: DangerZone[]): L.Circle[] {
    const circles: L.Circle[] = [];

    zones.forEach(zone => {
        const circle = L.circle(zone.center, {
            radius: zone.radius * 1000, // Convert km to meters
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '10, 10'
        }).addTo(map);

        circle.bindPopup(`
      <strong>${zone.name}</strong><br/>
      Severity: ${zone.severity}<br/>
      Reason: ${zone.reason}<br/>
      Radius: ${zone.radius}km<br/>
      Events: ${zone.events.length}
    `);

        circles.push(circle);
    });

    return circles;
}

/**
 * Check if coordinates are inside a danger zone
 */
export function isInDangerZone(lat: number, lng: number, zones: DangerZone[]): DangerZone | null {
    for (const zone of zones) {
        const distance = calculateDistance(lat, lng, zone.center[0], zone.center[1]);
        if (distance <= zone.radius) {
            return zone;
        }
    }
    return null;
}

/**
 * Predefined high-risk zones (manual curation)
 */
export const PREDEFINED_DANGER_ZONES: DangerZone[] = [
    {
        id: 'zone-ukraine',
        name: 'Ukraine Conflict Zone',
        center: [48.3794, 31.1656], // Central Ukraine
        radius: 300,
        severity: 'HIGH',
        reason: 'Active war zone - State conflict',
        color: '#dc2626',
        events: []
    },
    {
        id: 'zone-syria',
        name: 'Syria Conflict Zone',
        center: [35.0, 38.0],
        radius: 250,
        severity: 'HIGH',
        reason: 'Civil war and military operations',
        color: '#dc2626',
        events: []
    },
    {
        id: 'zone-gaza',
        name: 'Gaza Strip',
        center: [31.5, 34.45],
        radius: 50,
        severity: 'HIGH',
        reason: 'Active conflict - Military operations',
        color: '#dc2626',
        events: []
    },
    {
        id: 'zone-yemen',
        name: 'Yemen Conflict Zone',
        center: [15.5, 48.0],
        radius: 200,
        severity: 'HIGH',
        reason: 'Civil war and humanitarian crisis',
        color: '#dc2626',
        events: []
    },
    {
        id: 'zone-sahel',
        name: 'Sahel Region',
        center: [14.0, 2.0], // Niger/Mali/Burkina Faso
        radius: 400,
        severity: 'ELEVATED',
        reason: 'Terrorist activity and instability',
        color: '#f59e0b',
        events: []
    }
];
