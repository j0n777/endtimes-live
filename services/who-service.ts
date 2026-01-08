import { MonitorEvent, EventCategory, Severity } from '../types';

const WHO_RSS_URL = 'https://www.who.int/rss-feeds/news-english.xml';

interface WHOEvent {
    title: string;
    description: string;
    link: string;
    pubDate: string;
    category?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const isPandemicRelated = (title: string, description: string): boolean => {
    const text = (title + ' ' + description).toLowerCase();
    const keywords = [
        'outbreak', 'epidemic', 'pandemic', 'disease', 'virus',
        'infection', 'health emergency', 'cholera', 'ebola',
        'dengue', 'malaria', 'covid', 'influenza', 'measles',
        'polio', 'zika', 'mpox', 'monkeypox', 'hepatitis'
    ];

    return keywords.some(keyword => text.includes(keyword));
};

const determineSeverity = (title: string, description: string): Severity => {
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('emergency') || text.includes('outbreak') || text.includes('epidemic')) {
        return 'HIGH';
    }
    if (text.includes('alert') || text.includes('urgent')) {
        return 'ELEVATED';
    }

    return 'MEDIUM';
};

const extractLocation = (title: string, description: string): string => {
    // Try to extract country/region from title
    const locationMatch = title.match(/in ([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/);
    if (locationMatch) {
        return locationMatch[1];
    }

    // Try from description
    const descMatch = description.match(/in ([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/);
    if (descMatch) {
        return descMatch[1];
    }

    return 'Global';
};

// Simple geocoding fallback for major regions
const getApproximateCoordinates = (location: string): { lat: number; lng: number } => {
    const regionCoords: Record<string, { lat: number; lng: number }> = {
        'Africa': { lat: 0, lng: 20 },
        'Asia': { lat: 30, lng: 100 },
        'Europe': { lat: 50, lng: 10 },
        'Americas': { lat: 10, lng: -80 },
        'Global': { lat: 0, lng: 0 },
        'Congo': { lat: -4.3, lng: 15.3 },
        'Nigeria': { lat: 9.08, lng: 8.68 },
        'India': { lat: 20.59, lng: 78.96 },
        'China': { lat: 35.86, lng: 104.19 },
        'Uganda': { lat: 1.37, lng: 32.29 },
        'Pakistan': { lat: 30.37, lng: 69.34 },
    };

    return regionCoords[location] || { lat: 0, lng: 0 };
};

const parseWHOXML = (xmlText: string): WHOEvent[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const items = xmlDoc.querySelectorAll('item');
    const events: WHOEvent[] = [];

    items.forEach(item => {
        const title = item.querySelector('title')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const category = item.querySelector('category')?.textContent || '';

        // Only include pandemic/outbreak related news
        if (isPandemicRelated(title, description)) {
            events.push({
                title,
                description,
                link,
                pubDate,
                category,
            });
        }
    });

    return events;
};

export const fetchWHOEvents = async (): Promise<MonitorEvent[]> => {
    try {
        const response = await fetch(WHO_RSS_URL, {
            headers: {
                'Accept': 'application/xml, text/xml',
            },
        });

        if (!response.ok) {
            throw new Error(`WHO RSS error: ${response.status}`);
        }

        const xmlText = await response.text();
        const whoEvents = parseWHOXML(xmlText);

        return whoEvents.map(event => {
            const location = extractLocation(event.title, event.description);
            const coords = getApproximateCoordinates(location);

            return {
                id: generateId(),
                title: event.title,
                description: event.description,
                category: EventCategory.PANDEMIC,
                severity: determineSeverity(event.title, event.description),
                sourceType: 'OFFICIAL' as const,
                sourceName: 'WHO',
                location,
                coordinates: coords,
                timestamp: event.pubDate ? new Date(event.pubDate).toISOString() : new Date().toISOString(),
                sourceUrl: event.link,
            };
        });
    } catch (error) {
        console.error('WHO fetch error:', error);
        throw error;
    }
};
