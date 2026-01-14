import { MonitorEvent, EventCategory, Severity, SourceType } from '../types';

const NWS_ALERTS_URL = 'https://api.weather.gov/alerts/active';
const WEATHERBIT_ALERTS_URL = 'https://api.weatherbit.io/v2.0/alerts';

// Cache configuration
let cachedAlerts: MonitorEvent[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface WeatherAlertGeometry {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][]; // GeoJSON format
}

interface NWSAlertFeature {
    id: string;
    type: string;
    geometry: any;
    properties: {
        event: string;
        severity: string;
        certainty: string;
        urgency: string;
        headline: string;
        description: string;
        instruction?: string;
        areaDesc: string;
        sent: string;
        parameters?: {
            [key: string]: any[];
        };
    };
}

interface WeatherbitAlert {
    title: string;
    description: string;
    severity: string;
    uri: string;
    regions: string[];
    onset?: string;
    expires?: string;
    lat?: number;
    lon?: number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Map NWS severity to our system
const mapNWSSeverity = (severity: string): Severity => {
    const sev = severity.toLowerCase();
    if (sev === 'extreme') return 'HIGH';
    if (sev === 'severe') return 'HIGH';
    if (sev === 'moderate') return 'ELEVATED';
    if (sev === 'minor') return 'MEDIUM';
    return 'LOW';
};

// Map Weatherbit severity to our system
const mapWeatherbitSeverity = (severity: string): Severity => {
    const sev = severity.toLowerCase();
    if (sev.includes('extreme') || sev.includes('red')) return 'HIGH';
    if (sev.includes('severe') || sev.includes('orange')) return 'ELEVATED';
    if (sev.includes('moderate') || sev.includes('yellow')) return 'MEDIUM';
    return 'LOW';
};

// Filter severe weather events we care about
const isSevereWeatherEvent = (eventType: string): boolean => {
    const type = eventType.toLowerCase();

    // Tornados
    if (type.includes('tornado')) return true;

    // High winds (>100km/h = ~62mph)
    if (type.includes('high wind')) return true;
    if (type.includes('extreme wind')) return true;
    if (type.includes('severe thunderstorm')) return true;

    // Heavy rain / flooding
    if (type.includes('flash flood')) return true;
    if (type.includes('flood warning')) return true;

    // Severe storms
    if (type.includes('severe weather')) return true;
    if (type.includes('hurricane')) return true;
    if (type.includes('typhoon')) return true;
    if (type.includes('cyclone')) return true;

    return false;
};

// Extract wind speed from NWS parameters if available
const extractWindSpeed = (parameters?: { [key: string]: any[] }): number | undefined => {
    if (!parameters) return undefined;

    // Try to find wind speed in parameters
    if (parameters.windSpeed) {
        const windSpeed = parameters.windSpeed[0];
        if (typeof windSpeed === 'string') {
            const match = windSpeed.match(/(\d+)/);
            if (match) {
                const mph = parseInt(match[1]);
                return mph * 1.60934; // Convert mph to km/h
            }
        }
    }

    return undefined;
};

// Calculate center point of polygon for marker placement
const calculatePolygonCenter = (geometry: any): { lat: number; lng: number } => {
    if (!geometry || !geometry.coordinates) {
        return { lat: 0, lng: 0 };
    }

    let coordinates = geometry.coordinates;

    // Handle MultiPolygon (use first polygon)
    if (geometry.type === 'MultiPolygon') {
        coordinates = coordinates[0];
    }

    // Handle Polygon (use outer ring)
    if (geometry.type === 'Polygon') {
        coordinates = coordinates[0];
    }

    // Calculate average lat/lng
    let sumLat = 0, sumLng = 0, count = 0;

    coordinates.forEach((coord: number[]) => {
        sumLng += coord[0]; // GeoJSON is [lng, lat]
        sumLat += coord[1];
        count++;
    });

    return {
        lat: sumLat / count,
        lng: sumLng / count
    };
};

// Fetch NWS alerts
const fetchNWSAlerts = async (): Promise<MonitorEvent[]> => {
    try {
        const response = await fetch(NWS_ALERTS_URL, {
            headers: {
                'User-Agent': 'End-Times-Monitor/1.0 (Weather Alert Monitoring)',
                'Accept': 'application/geo+json'
            }
        });

        if (!response.ok) {
            throw new Error(`NWS API error: ${response.status}`);
        }

        const data = await response.json();
        const features: NWSAlertFeature[] = data.features || [];

        console.log(`🌪️ NWS: Received ${features.length} total alerts`);

        // Filter for severe weather events
        const severeAlerts = features.filter(feature =>
            isSevereWeatherEvent(feature.properties.event)
        );

        console.log(`🌪️ NWS: Filtered to ${severeAlerts.length} severe weather alerts`);

        return severeAlerts.map(feature => {
            const center = calculatePolygonCenter(feature.geometry);
            const windSpeed = extractWindSpeed(feature.properties.parameters);

            return {
                id: `nws-${feature.id}`,
                title: feature.properties.event,
                description: feature.properties.headline || feature.properties.description,
                category: EventCategory.NATURAL_DISASTER,
                severity: mapNWSSeverity(feature.properties.severity),
                sourceType: SourceType.OFFICIAL,
                sourceName: 'NWS',
                location: feature.properties.areaDesc,
                coordinates: center,
                timestamp: feature.properties.sent || new Date().toISOString(),
                sourceUrl: `https://www.weather.gov/alerts`,
                // Store geometry for polygon rendering
                alertGeometry: feature.geometry ? {
                    type: feature.geometry.type,
                    coordinates: feature.geometry.coordinates
                } : undefined,
                // Store additional metadata
                eventType: feature.properties.event,
                urgency: feature.properties.urgency,
                parameters: windSpeed ? { windSpeed } : undefined
            } as MonitorEvent;
        });

    } catch (error) {
        console.error('❌ NWS fetch error:', error);
        return [];
    }
};

// Fetch Weatherbit alerts (global coverage)
const fetchWeatherbitAlerts = async (apiKey?: string): Promise<MonitorEvent[]> => {
    if (!apiKey) {
        console.log('⚠️ Weatherbit: API key not provided, skipping');
        return [];
    }

    try {
        // Get global alerts - we'll filter by severity
        const response = await fetch(`${WEATHERBIT_ALERTS_URL}?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`Weatherbit API error: ${response.status}`);
        }

        const data = await response.json();
        const alerts: WeatherbitAlert[] = data.alerts || [];

        console.log(`🌍 Weatherbit: Received ${alerts.length} alerts`);

        // Filter for severe weather
        const severeAlerts = alerts.filter(alert =>
            isSevereWeatherEvent(alert.title)
        );

        console.log(`🌍 Weatherbit: Filtered to ${severeAlerts.length} severe alerts`);

        return severeAlerts.map(alert => ({
            id: `weatherbit-${generateId()}`,
            title: alert.title,
            description: alert.description,
            category: EventCategory.NATURAL_DISASTER,
            severity: mapWeatherbitSeverity(alert.severity),
            sourceType: SourceType.RSS,
            sourceName: 'Weatherbit',
            location: alert.regions.join(', '),
            coordinates: {
                lat: alert.lat || 0,
                lng: alert.lon || 0
            },
            timestamp: alert.onset || new Date().toISOString(),
            sourceUrl: alert.uri,
            eventType: alert.title
        } as MonitorEvent));

    } catch (error) {
        console.error('❌ Weatherbit fetch error:', error);
        return [];
    }
};

// Main fetch function with caching
export const fetchWeatherAlerts = async (config?: {
    nwsEnabled?: boolean;
    weatherbitApiKey?: string;
    weatherbitEnabled?: boolean;
}): Promise<MonitorEvent[]> => {
    const now = Date.now();

    // Return cached data if still valid
    if (cachedAlerts.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('🌪️ Weather Alerts: Using cached data');
        return cachedAlerts;
    }

    console.log('🌪️ Weather Alerts: Fetching fresh data...');

    const alerts: MonitorEvent[] = [];

    // Fetch from NWS (default enabled)
    if (config?.nwsEnabled !== false) {
        const nwsAlerts = await fetchNWSAlerts();
        alerts.push(...nwsAlerts);
    }

    // Fetch from Weatherbit if enabled and API key provided
    if (config?.weatherbitEnabled && config.weatherbitApiKey) {
        const weatherbitAlerts = await fetchWeatherbitAlerts(config.weatherbitApiKey);
        alerts.push(...weatherbitAlerts);
    }

    // Update cache
    cachedAlerts = alerts;
    lastFetchTime = now;

    console.log(`✅ Weather Alerts: Loaded ${alerts.length} severe weather alerts`);

    return alerts;
};
