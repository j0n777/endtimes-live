// Internet Shutdown Detection Service
// Uses Cloudflare Radar API for real-time internet disruption data
// Covers entire countries when internet is down

import { MonitorEvent, EventCategory, Severity } from '../types';

const CLOUDFLARE_RADAR_API = 'https://api.cloudflare.com/client/v4/radar';

// Country centroids for map visualization (when internet is down, mark entire country)
const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number; name: string }> = {
    'IR': { lat: 32.4279, lng: 53.6880, name: 'Iran' },
    'MM': { lat: 21.9162, lng: 95.9560, name: 'Myanmar' },
    'RU': { lat: 61.5240, lng: 105.3188, name: 'Russia' },
    'CN': { lat: 35.8617, lng: 104.1954, name: 'China' },
    'IN': { lat: 20.5937, lng: 78.9629, name: 'India' },
    'TR': { lat: 38.9637, lng: 35.2433, name: 'Turkey' },
    'PK': { lat: 30.3753, lng: 69.3451, name: 'Pakistan' },
    'BD': { lat: 23.6850, lng: 90.3563, name: 'Bangladesh' },
    'ET': { lat: 9.1450, lng: 40.4897, name: 'Ethiopia' },
    'CD': { lat: -4.0383, lng: 21.7587, name: 'DR Congo' },
    'SY': { lat: 34.8021, lng: 38.9968, name: 'Syria' },
    'YE': { lat: 15.5527, lng: 48.5164, name: 'Yemen' },
    'VE': { lat: 6.4238, lng: -66.5897, name: 'Venezuela' },
    'CU': { lat: 21.5218, lng: -77.7812, name: 'Cuba' },
    'KP': { lat: 40.3399, lng: 127.5101, name: 'North Korea' },
};

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Fetch internet shutdown data from Cloudflare Radar
 * Note: Cloudflare Radar API requires authentication
 * For now, using curated list of known shutdowns
 * TODO: Integrate with actual Cloudflare Radar API when available
 */
export const fetchInternetShutdowns = async (): Promise<MonitorEvent[]> => {
    try {
        // Curated list of current/recent internet shutdowns
        // Based on Access Now #KeepItOn campaign data
        const shutdowns = [
            {
                country: 'IR',
                reason: 'Government-imposed internet restrictions during protests',
                severity: 'HIGH' as Severity,
                duration: 'Ongoing',
                affectedServices: ['Social media', 'Mobile internet', 'Messaging apps']
            },
            {
                country: 'MM',
                reason: 'Military junta internet blackouts in conflict regions',
                severity: 'HIGH' as Severity,
                duration: 'Intermittent',
                affectedServices: ['Mobile internet', 'Broadband']
            },
            {
                country: 'ET',
                reason: 'Regional shutdowns during civil conflict (Tigray, Oromia)',
                severity: 'ELEVATED' as Severity,
                duration: '12+ months',
                affectedServices: ['All internet services']
            },
            {
                country: 'PK',
                reason: 'Political instability - intermittent social media blocks',
                severity: 'ELEVATED' as Severity,
                duration: 'Periodic',
                affectedServices: ['Twitter/X', 'Facebook', 'YouTube']
            },
            {
                country: 'IN',
                reason: 'Kashmir region - longest internet shutdown (18+ months historical)',
                severity: 'ELEVATED' as Severity,
                duration: 'Restored but with restrictions',
                affectedServices: ['4G services', 'Social media']
            },
        ];

        return shutdowns.map(shutdown => {
            const countryData = COUNTRY_CENTROIDS[shutdown.country];
            if (!countryData) return null;

            return {
                id: generateId(),
                title: `🌐 Internet Shutdown: ${countryData.name}`,
                description: `${shutdown.reason} | Duration: ${shutdown.duration} | Affected: ${shutdown.affectedServices.join(', ')}`,
                category: EventCategory.TECHNOLOGY,
                severity: shutdown.severity,
                sourceType: 'OFFICIAL' as const,
                sourceName: 'Internet Shutdown Monitor',
                location: countryData.name,
                coordinates: {
                    lat: countryData.lat,
                    lng: countryData.lng,
                },
                timestamp: new Date().toISOString(),
                sourceUrl: 'https://www.accessnow.org/keepiton/',
                // Special flag to indicate this covers entire country
                metadata: {
                    type: 'country-wide',
                    countryCode: shutdown.country,
                    affectedPopulation: 'Millions'
                }
            };
        }).filter(Boolean) as MonitorEvent[];

    } catch (error) {
        console.error('Internet shutdown fetch error:', error);
        return [];
    }
};

/**
 * Future enhancement: Integrate with Cloudflare Radar API
 * https://developers.cloudflare.com/api/operations/radar-get-attacks
 */
export const fetchCloudflareRadarData = async (apiKey?: string): Promise<any> => {
    // TODO: Implement when API key available
    // const response = await fetch(`${CLOUDFLARE_RADAR_API}/attacks/layer3/summary`, {
    //   headers: { 'Authorization': `Bearer ${apiKey}` }
    // });
    return [];
};
