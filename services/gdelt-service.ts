import { MonitorEvent, EventCategory, Severity, ConflictLevel } from '../types';

const GDELT_BASE_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

interface GDELTArticle {
    url: string;
    url_mobile?: string;
    title: string;
    seendate: string;
    socialimage?: string;
    domain: string;
    language: string;
    sourcecountry: string;
}

interface GDELTResponse {
    articles: GDELTArticle[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const classifyGDELTEvent = (title: string): {
    category: EventCategory;
    severity: Severity;
    conflictLevel?: ConflictLevel;
} => {
    const text = title.toLowerCase();

    // Conflict keywords
    const conflictKeywords = ['war', 'attack', 'strike', 'military', 'troops', 'missile', 'combat', 'battle'];
    const disasterKeywords = ['earthquake', 'flood', 'hurricane', 'fire', 'volcano', 'storm', 'tsunami'];
    const pandemicKeywords = ['virus', 'outbreak', 'pandemic', 'disease', 'covid', 'epidemic'];
    const economicKeywords = ['crisis', 'collapse', 'recession', 'inflation', 'bank', 'default'];

    let category = EventCategory.CONFLICT;
    let conflictLevel: ConflictLevel | undefined;

    if (disasterKeywords.some(k => text.includes(k))) {
        category = EventCategory.NATURAL_DISASTER;
    } else if (pandemicKeywords.some(k => text.includes(k))) {
        category = EventCategory.PANDEMIC;
    } else if (economicKeywords.some(k => text.includes(k))) {
        category = EventCategory.ECONOMIC;
    } else if (conflictKeywords.some(k => text.includes(k))) {
        category = EventCategory.CONFLICT;
        conflictLevel = ConflictLevel.MILITIA_ACTION;
    }

    // Severity
    const highSeverityKeywords = ['major', 'massive', 'deadly', 'critical', 'catastrophic'];
    const elevatedKeywords = ['significant', 'serious', 'escalating'];

    let severity: Severity = 'MEDIUM';
    if (highSeverityKeywords.some(k => text.includes(k))) {
        severity = 'HIGH';
    } else if (elevatedKeywords.some(k => text.includes(k))) {
        severity = 'ELEVATED';
    }

    return { category, severity, conflictLevel };
};

// Geocoding for countries mentioned in GDELT
const getCountryCoordinates = (sourcecountry: string): { lat: number; lng: number } => {
    const countryCoords: Record<string, { lat: number; lng: number }> = {
        'US': { lat: 37.09, lng: -95.71 },
        'Ukraine': { lat: 48.38, lng: 31.16 },
        'Russia': { lat: 61.52, lng: 105.31 },
        'Israel': { lat: 31.04, lng: 34.85 },
        'China': { lat: 35.86, lng: 104.19 },
        'Iran': { lat: 32.42, lng: 53.68 },
        'Syria': { lat: 34.80, lng: 38.99 },
        'Yemen': { lat: 15.55, lng: 48.51 },
        'India': { lat: 20.59, lng: 78.96 },
        'Pakistan': { lat: 30.37, lng: 69.34 },
    };

    return countryCoords[sourcecountry] || { lat: 0, lng: 0 };
};

export const fetchGDELTEvents = async (): Promise<MonitorEvent[]> => {
    try {
        // Query for recent conflict and disaster news
        const queries = [
            'military conflict',
            'natural disaster',
            'earthquake',
            'armed conflict',
        ];

        const allEvents: MonitorEvent[] = [];

        for (const query of queries) {
            const params = new URLSearchParams({
                query: query,
                mode: 'artlist',
                maxrecords: '25',
                format: 'json',
                timespan: '7d', // Last 7 days
            });

            const response = await fetch(`${GDELT_BASE_URL}?${params.toString()}`);

            if (!response.ok) {
                console.warn(`GDELT query "${query}" failed: ${response.status}`);
                continue;
            }

            const data: GDELTResponse = await response.json();

            if (data.articles && data.articles.length > 0) {
                const events = data.articles.slice(0, 10).map(article => {
                    const classification = classifyGDELTEvent(article.title);
                    const coords = getCountryCoordinates(article.sourcecountry);

                    return {
                        id: generateId(),
                        title: article.title,
                        description: `Source: ${article.domain} | Country: ${article.sourcecountry}`,
                        category: classification.category,
                        severity: classification.severity,
                        conflictLevel: classification.conflictLevel,
                        sourceType: 'RSS' as const,
                        sourceName: 'GDELT',
                        location: article.sourcecountry || 'Unknown',
                        coordinates: coords,
                        timestamp: article.seendate ? new Date(article.seendate).toISOString() : new Date().toISOString(),
                        sourceUrl: article.url,
                    };
                });

                allEvents.push(...events);
            }
        }

        // Deduplicate by URL
        const uniqueEvents = Array.from(
            new Map(allEvents.map(e => [e.sourceUrl, e])).values()
        );

        return uniqueEvents;
    } catch (error) {
        console.error('GDELT fetch error:', error);
        throw error;
    }
};
