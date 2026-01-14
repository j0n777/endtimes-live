import { MonitorEvent, EventCategory, Severity } from '../types';

const NASA_EONET_BASE_URL = 'https://eonet.gsfc.nasa.gov/api/v3';

interface EONETGeometry {
    type: string;
    coordinates: number[] | number[][];
}

interface EONETEvent {
    id: string;
    title: string;
    description: string | null;
    categories: Array<{ id: string; title: string }>;
    sources: Array<{ id: string; url: string }>;
    geometry: EONETGeometry[];
    link?: string;
    closed?: string | null;
}

interface EONETResponse {
    events: EONETEvent[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const mapEONETCategory = (categories: Array<{ id: string; title: string }>): EventCategory => {
    if (categories.length === 0) return EventCategory.NATURAL_DISASTER;

    const categoryId = categories[0].id.toLowerCase();

    if (categoryId.includes('wildfire') || categoryId.includes('fire')) {
        return EventCategory.NATURAL_DISASTER;
    }
    if (categoryId.includes('storm') || categoryId.includes('severe')) {
        return EventCategory.NATURAL_DISASTER;
    }
    if (categoryId.includes('volcano')) {
        return EventCategory.NATURAL_DISASTER;
    }
    if (categoryId.includes('flood')) {
        return EventCategory.NATURAL_DISASTER;
    }
    if (categoryId.includes('drought')) {
        return EventCategory.NATURAL_DISASTER;
    }

    return EventCategory.NATURAL_DISASTER;
};

const determineSeverity = (event: EONETEvent): Severity => {
    const title = event.title.toLowerCase();

    if (title.includes('major') || title.includes('severe') || title.includes('extreme')) {
        return 'HIGH';
    }
    if (title.includes('significant') || title.includes('dangerous')) {
        return 'ELEVATED';
    }

    return 'MEDIUM';
};

const extractCoordinates = (geometry: EONETGeometry[]): { lat: number; lng: number } => {
    if (geometry.length === 0) {
        return { lat: 0, lng: 0 };
    }

    const firstGeom = geometry[0];

    if (firstGeom.type === 'Point') {
        const coords = firstGeom.coordinates as number[];
        return { lat: coords[1], lng: coords[0] }; // GeoJSON is [lng, lat]
    }

    if (firstGeom.type === 'Polygon' || firstGeom.type === 'MultiPoint') {
        const coords = (firstGeom.coordinates as number[][])[0];
        return { lat: coords[1], lng: coords[0] };
    }

    return { lat: 0, lng: 0 };
};

export const fetchNASAEONETEvents = async (apiKey?: string): Promise<MonitorEvent[]> => {
    try {
        const url = apiKey
            ? `${NASA_EONET_BASE_URL}/events?status=open&api_key=${apiKey}`
            : `${NASA_EONET_BASE_URL}/events?status=open`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NASA EONET API error: ${response.status}`);
        }

        const data: EONETResponse = await response.json();

        console.log(`🌌 NASA EONET: Received ${data.events.length} total events`);

        // Map all events first to determine severity
        const allEvents = data.events.map(event => {
            const coords = extractCoordinates(event.geometry);
            const sourceUrl = event.sources[0]?.url || event.link || '';
            const severity = determineSeverity(event);

            return {
                id: generateId(),
                title: event.title,
                description: event.description || event.categories.map(c => c.title).join(', '),
                category: mapEONETCategory(event.categories),
                severity,
                sourceType: 'OFFICIAL' as const,
                sourceName: 'NASA EONET',
                location: event.title.split(',').pop()?.trim() || 'Global',
                coordinates: coords,
                timestamp: new Date().toISOString(),
                sourceUrl,
            };
        });

        // Filter for HIGH and ELEVATED severity only
        const filteredEvents = allEvents.filter(e =>
            e.severity === 'HIGH' || e.severity === 'ELEVATED'
        );

        console.log(`🌌 NASA EONET: Filtered to ${filteredEvents.length} significant events (HIGH/ELEVATED)`);

        // Limit to top 25
        const limitedEvents = filteredEvents
            .sort((a, b) => {
                const severityOrder: Record<string, number> = { 'HIGH': 0, 'ELEVATED': 1, 'MEDIUM': 2, 'LOW': 3 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            })
            .slice(0, 25);

        console.log(`🌌 NASA EONET: Limited to top ${limitedEvents.length} most severe`);

        return limitedEvents;
    } catch (error) {
        console.error('NASA EONET fetch error:', error);
        throw error;
    }
};
