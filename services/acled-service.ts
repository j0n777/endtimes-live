import { MonitorEvent, EventCategory, Severity, ConflictLevel } from '../types';

const ACLED_BASE_URL = 'https://api.acleddata.com/acled/read';

interface ACLEDEvent {
    event_id_cnty: string;
    event_date: string;
    event_type: string;
    sub_event_type: string;
    actor1: string;
    actor2: string;
    fatalities: number;
    country: string;
    location: string;
    latitude: number;
    longitude: number;
    notes: string;
    source: string;
}

interface ACLEDResponse {
    success: boolean;
    data: ACLEDEvent[];
    count: number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const mapACLEDEventType = (eventType: string, subEventType: string): EventCategory => {
    const type = eventType.toLowerCase();

    if (type.includes('battle') || type.includes('explosion') || type.includes('violence')) {
        return EventCategory.CONFLICT;
    }
    if (type.includes('protest') || type.includes('riot')) {
        return EventCategory.CONFLICT;
    }

    return EventCategory.CONFLICT;
};

const mapACLEDConflictLevel = (eventType: string, fatalities: number): ConflictLevel => {
    const type = eventType.toLowerCase();

    if (fatalities > 50) return ConflictLevel.STATE_WAR;
    if (type.includes('battle')) return ConflictLevel.MILITIA_ACTION;
    if (type.includes('explosion')) return ConflictLevel.MILITIA_ACTION;
    if (type.includes('violence against civilians')) return ConflictLevel.MILITIA_ACTION;
    if (type.includes('protest')) return ConflictLevel.RIOT_UNREST;
    if (type.includes('riot')) return ConflictLevel.RIOT_UNREST;

    return ConflictLevel.POLITICAL_THREAT;
};

const mapACLEDSeverity = (fatalities: number, eventType: string): Severity => {
    if (fatalities > 100) return 'HIGH';
    if (fatalities > 20) return 'ELEVATED';
    if (fatalities > 5) return 'MEDIUM';

    if (eventType.toLowerCase().includes('protest') || eventType.toLowerCase().includes('riot')) {
        return 'LOW';
    }

    return 'MEDIUM';
};

export const fetchACLEDEvents = async (apiKey: string, email: string): Promise<MonitorEvent[]> => {
    if (!apiKey || !email) {
        throw new Error('ACLED requires both API key and email');
    }

    try {
        // Get events from the last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const params = new URLSearchParams({
            key: apiKey,
            email: email,
            event_date: `${startDate.toISOString().split('T')[0]}|${endDate.toISOString().split('T')[0]}`,
            event_date_where: 'BETWEEN',
            limit: '100',
        });

        const response = await fetch(`${ACLED_BASE_URL}?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`ACLED API error: ${response.status}`);
        }

        const data: ACLEDResponse = await response.json();

        if (!data.success || !data.data) {
            throw new Error('ACLED API returned unsuccessful response');
        }

        return data.data.map(event => ({
            id: generateId(),
            title: `${event.event_type}: ${event.sub_event_type}`,
            description: `${event.notes.substring(0, 200)}... | Fatalities: ${event.fatalities} | Actors: ${event.actor1}${event.actor2 ? ' vs ' + event.actor2 : ''}`,
            category: mapACLEDEventType(event.event_type, event.sub_event_type),
            severity: mapACLEDSeverity(event.fatalities, event.event_type),
            conflictLevel: mapACLEDConflictLevel(event.event_type, event.fatalities),
            sourceType: 'OFFICIAL' as const,
            sourceName: 'ACLED',
            location: `${event.location}, ${event.country}`,
            coordinates: {
                lat: event.latitude,
                lng: event.longitude,
            },
            timestamp: new Date(event.event_date).toISOString(),
            sourceUrl: `https://acleddata.com/data-export-tool/`,
        }));
    } catch (error) {
        console.error('ACLED fetch error:', error);
        throw error;
    }
};
