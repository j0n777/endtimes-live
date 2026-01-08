import { MonitorEvent, EventCategory, Severity } from '../types';

const GDACS_RSS_URL = 'https://www.gdacs.org/xml/rss.xml';

interface GDACSEvent {
    title: string;
    description: string;
    link: string;
    pubDate: string;
    category: string;
    severity: string; // 'Green', 'Orange', 'Red'
    lat?: number;
    lng?: number;
    location?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const mapGDACSCategory = (category: string): EventCategory => {
    const cat = category.toLowerCase();
    if (cat.includes('earthquake') || cat.includes('tsunami') || cat.includes('volcano')) {
        return EventCategory.NATURAL_DISASTER;
    }
    if (cat.includes('cyclone') || cat.includes('flood') || cat.includes('storm')) {
        return EventCategory.NATURAL_DISASTER;
    }
    return EventCategory.NATURAL_DISASTER;
};

const mapGDACSeverity = (severity: string): Severity => {
    const sev = severity.toLowerCase();
    if (sev.includes('red')) return 'HIGH';
    if (sev.includes('orange')) return 'ELEVATED';
    return 'MEDIUM';
};

const parseGDACSXML = (xmlText: string): GDACSEvent[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const items = xmlDoc.querySelectorAll('item');
    const events: GDACSEvent[] = [];

    items.forEach(item => {
        const title = item.querySelector('title')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';

        // GDACS uses different namespaces, try to extract severity and coordinates
        const category = item.querySelector('category')?.textContent || 'disaster';

        // Try to extract coordinates from description or georss
        const geoPoint = item.getElementsByTagNameNS('http://www.georss.org/georss', 'point')[0];
        let lat: number | undefined;
        let lng: number | undefined;

        if (geoPoint) {
            const coords = geoPoint.textContent?.split(' ');
            if (coords && coords.length === 2) {
                lat = parseFloat(coords[0]);
                lng = parseFloat(coords[1]);
            }
        }

        // Determine severity from title/description
        let severity = 'Green';
        if (title.toLowerCase().includes('red') || description.toLowerCase().includes('red alert')) {
            severity = 'Red';
        } else if (title.toLowerCase().includes('orange') || description.toLowerCase().includes('orange alert')) {
            severity = 'Orange';
        }

        events.push({
            title,
            description,
            link,
            pubDate,
            category,
            severity,
            lat,
            lng,
            location: title.split(' in ')[1] || 'Unknown'
        });
    });

    return events;
};

export const fetchGDACSEvents = async (): Promise<MonitorEvent[]> => {
    try {
        const response = await fetch(GDACS_RSS_URL, {
            headers: {
                'Accept': 'application/xml, text/xml',
            },
        });

        if (!response.ok) {
            throw new Error(`GDACS API error: ${response.status}`);
        }

        const xmlText = await response.text();
        const gdacsEvents = parseGDACSXML(xmlText);

        return gdacsEvents.map(event => ({
            id: generateId(),
            title: event.title,
            description: event.description,
            category: mapGDACSCategory(event.category),
            severity: mapGDACSeverity(event.severity),
            sourceType: 'RSS' as const,
            sourceName: 'GDACS',
            location: event.location || 'Unknown Location',
            coordinates: {
                lat: event.lat || 0,
                lng: event.lng || 0,
            },
            timestamp: event.pubDate ? new Date(event.pubDate).toISOString() : new Date().toISOString(),
            sourceUrl: event.link,
        }));
    } catch (error) {
        console.error('GDACS fetch error:', error);
        throw error;
    }
};
