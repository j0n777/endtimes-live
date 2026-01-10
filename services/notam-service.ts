import { MonitorEvent, EventCategory, Severity, ConflictLevel } from '../types';

// NOTAMs (Notice to Airmen) - Airspace Restrictions
// Indicates military activity, conflict zones, and restricted airspace
// Currently using curated data based on known conflict zones
// TODO: Integrate with Aviation Edge API or FAA NOTAM database

interface AirspaceRestriction {
    location: string;
    region: string;
    reason: string;
    severity: Severity;
    coordinates: { lat: number; lng: number };
    conflictLevel?: ConflictLevel;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Fetch NOTAM events (airspace restrictions)
 * Currently using curated list of known restricted airspaces
 * 
 * Airspace closures are STRONG indicators of:
 * - Military operations
 * - Active conflicts
 * - Imminent attacks
 * - Training exercises in conflict zones
 */
export const fetchNOTAMEvents = async (): Promise<MonitorEvent[]> => {
    try {
        // Curated airspace restrictions based on current geopolitical situation
        const restrictions: AirspaceRestriction[] = [
            // Active Conflict Zones
            {
                location: 'Syria',
                region: 'Damascus FIR',
                reason: 'FIR Damascus closed to civilian traffic - Active military operations',
                severity: 'HIGH',
                coordinates: { lat: 33.5138, lng: 36.2765 },
                conflictLevel: ConflictLevel.STATE_WAR
            },
            {
                location: 'Ukraine - Eastern Region',
                region: 'Dnipro FIR (partial)',
                reason: 'Active combat zone - Civilian flights prohibited',
                severity: 'HIGH',
                coordinates: { lat: 48.4647, lng: 35.0462 },
                conflictLevel: ConflictLevel.STATE_WAR
            },
            {
                location: 'Yemen',
                region: 'Sana\'a FIR',
                reason: 'Armed conflict - Airspace restricted due to ongoing military operations',
                severity: 'HIGH',
                coordinates: { lat: 15.3694, lng: 44.1910 },
                conflictLevel: ConflictLevel.STATE_WAR
            },
            {
                location: 'Gaza Strip',
                region: 'Israel/Palestine Airspace',
                reason: 'Military operations zone - Civilian aircraft prohibited',
                severity: 'HIGH',
                coordinates: { lat: 31.5, lng: 34.45 },
                conflictLevel: ConflictLevel.STATE_WAR
            },

            // High-Risk Regions
            {
                location: 'Afghanistan',
                region: 'Kabul FIR',
                reason: 'Continued security concerns - Limited civilian operations',
                severity: 'ELEVATED',
                coordinates: { lat: 34.5553, lng: 69.2075 },
                conflictLevel: ConflictLevel.MILITIA_ACTION
            },
            {
                location: 'Somalia',
                region: 'Mogadishu FIR (coastal)',
                reason: 'Terrorist activity and piracy - Restricted airspace',
                severity: 'ELEVATED',
                coordinates: { lat: 2.0469, lng: 45.3182 },
                conflictLevel: ConflictLevel.MILITIA_ACTION
            },
            {
                location: 'Libya',
                region: 'Tripoli FIR',
                reason: 'Civil unrest and militia activity - Partial restrictions',
                severity: 'ELEVATED',
                coordinates: { lat: 32.8872, lng: 13.1913 },
                conflictLevel: ConflictLevel.MILITIA_ACTION
            },

            // Strategic/Military Exercise Areas
            {
                location: 'Black Sea Region',
                region: 'Black Sea Airspace (portions)',
                reason: 'Military exercises and heightened tensions - Restricted zones',
                severity: 'ELEVATED',
                coordinates: { lat: 44.0, lng: 35.0 },
                conflictLevel: ConflictLevel.MILITARY_MOVEMENT
            },
            {
                location: 'Taiwan Strait',
                region: 'Taipei FIR (partial)',
                reason: 'Heightened military activity - Restricted zones during exercises',
                severity: 'ELEVATED',
                coordinates: { lat: 24.5, lng: 120.5 },
                conflictLevel: ConflictLevel.MILITARY_MOVEMENT
            },
            {
                location: 'Korean Peninsula - DMZ',
                region: 'Korea DMZ Airspace',
                reason: 'Permanent restricted zone - Military demarcation line',
                severity: 'ELEVATED',
                coordinates: { lat: 38.0, lng: 127.0 },
                conflictLevel: ConflictLevel.POLITICAL_THREAT
            },
        ];

        return restrictions.map(restriction => ({
            id: generateId(),
            title: `✈️ Airspace Restriction: ${restriction.location}`,
            description: `${restriction.reason} | Region: ${restriction.region}`,
            category: EventCategory.CONFLICT,
            severity: restriction.severity,
            conflictLevel: restriction.conflictLevel,
            sourceType: 'OFFICIAL' as const,
            sourceName: 'NOTAM / Airspace Data',
            location: restriction.location,
            coordinates: restriction.coordinates,
            timestamp: new Date().toISOString(),
            sourceUrl: 'https://www.notams.faa.gov/',
        }));

    } catch (error) {
        console.error('NOTAM fetch error:', error);
        return [];
    }
};
