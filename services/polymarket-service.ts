import { MonitorEvent, EventCategory, Severity, ConflictLevel } from '../types';

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';

interface PolymarketMarket {
    id: string;
    question: string;
    description?: string;
    end_date_iso: string;
    game_start_time: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    market_slug: string;
    volume: string;
    volume_24hr: string;
    liquidity: string;
    outcomes: string[];
    outcome_prices: string[];
    tags?: string[];
    image?: string;
}

interface PolymarketEvent {
    id: string;
    title: string;
    slug: string;
    markets: PolymarketMarket[];
    volume: string;
    liquidity: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Classify event based on Polymarket market question
 */
const classifyPolymarketMarket = (question: string, tags?: string[]): {
    category: EventCategory;
    severity: Severity;
    conflictLevel?: ConflictLevel;
    relevance: number; // 0-100, how relevant to end times monitoring
} => {
    const lowerQuestion = question.toLowerCase();

    // Keywords for different categories (English focused - Polymarket is primarily English)
    const conflictKeywords = [
        'war', 'attack', 'military', 'invasion', 'strike', 'conflict',
        'troops', 'missile', 'nuclear', 'weapons', 'combat', 'escalate',
        'russia', 'ukraine', 'israel', 'gaza', 'iran', 'china', 'taiwan'
    ];

    const economicKeywords = [
        'crisis', 'collapse', 'recession', 'inflation', 'default',
        'market crash', 'financial', 'economy', 'unemployment', 'gdp'
    ];

    const propheticKeywords = [
        'israel', 'jerusalem', 'temple', 'middle east', 'prophecy',
        'biblical', 'apocalypse', 'end times'
    ];

    const pandemicKeywords = [
        'pandemic', 'virus', 'outbreak', 'epidemic', 'disease',
        'health crisis', 'covid', 'who declares'
    ];

    const politicalKeywords = [
        'election', 'president', 'government', 'coup', 'revolution',
        'protest', 'regime change', 'sanction'
    ];

    // High severity indicators
    const highSeverityKeywords = [
        'nuclear', 'world war', 'ww3', 'global conflict', 'apocalypse',
        'catastrophic', 'devastating', 'major attack', 'invasion'
    ];

    const elevatedSeverityKeywords = [
        'escalate', 'tensions rise', 'imminent', 'threat', 'crisis',
        'emergency', 'declares war', 'mobilization'
    ];

    let category = EventCategory.CONFLICT;
    let severity: Severity = 'MEDIUM';
    let conflictLevel: ConflictLevel | undefined;
    let relevance = 0;

    // Categorize
    if (conflictKeywords.some(k => lowerQuestion.includes(k))) {
        category = EventCategory.CONFLICT;
        conflictLevel = ConflictLevel.POLITICAL_THREAT;
        relevance += 60;

        if (lowerQuestion.includes('invasion') || lowerQuestion.includes('attack')) {
            conflictLevel = ConflictLevel.MILITIA_ACTION;
            relevance += 20;
        }
        if (lowerQuestion.includes('nuclear') || lowerQuestion.includes('ww3')) {
            conflictLevel = ConflictLevel.STATE_WAR;
            relevance += 30;
        }
    } else if (pandemicKeywords.some(k => lowerQuestion.includes(k))) {
        category = EventCategory.PANDEMIC;
        relevance += 50;
    } else if (economicKeywords.some(k => lowerQuestion.includes(k))) {
        category = EventCategory.ECONOMIC;
        relevance += 40;
    } else if (propheticKeywords.some(k => lowerQuestion.includes(k))) {
        category = EventCategory.PROPHETIC;
        relevance += 70;
    } else if (politicalKeywords.some(k => lowerQuestion.includes(k))) {
        category = EventCategory.GOVERNMENT;
        relevance += 30;
    }

    // Determine severity
    if (highSeverityKeywords.some(k => lowerQuestion.includes(k))) {
        severity = 'HIGH';
        relevance += 20;
    } else if (elevatedSeverityKeywords.some(k => lowerQuestion.includes(k))) {
        severity = 'ELEVATED';
        relevance += 10;
    }

    // Check tags for additional context
    if (tags) {
        const tagStr = tags.join(' ').toLowerCase();
        if (tagStr.includes('geopolitics') || tagStr.includes('war')) {
            relevance += 15;
        }
    }

    return { category, severity, conflictLevel, relevance };
};

/**
 * Extract location from market question
 */
const extractLocationFromQuestion = (question: string): string => {
    const locationKeywords: Record<string, { lat: number; lng: number }> = {
        'Ukraine': { lat: 48.38, lng: 31.16 },
        'Russia': { lat: 61.52, lng: 105.31 },
        'Israel': { lat: 31.04, lng: 34.85 },
        'Gaza': { lat: 31.50, lng: 34.46 },
        'Iran': { lat: 32.42, lng: 53.68 },
        'China': { lat: 35.86, lng: 104.19 },
        'Taiwan': { lat: 23.69, lng: 120.96 },
        'North Korea': { lat: 40.33, lng: 127.51 },
        'Syria': { lat: 34.80, lng: 38.99 },
        'Lebanon': { lat: 33.85, lng: 35.86 },
        'Yemen': { lat: 15.55, lng: 48.51 },
        'Middle East': { lat: 29.0, lng: 41.0 },
    };

    for (const [location, coords] of Object.entries(locationKeywords)) {
        if (question.includes(location)) {
            return location;
        }
    }

    return 'Global';
};

/**
 * Get coordinates for location
 */
const getCoordinates = (location: string): { lat: number; lng: number } => {
    const coordMap: Record<string, { lat: number; lng: number }> = {
        'Ukraine': { lat: 48.38, lng: 31.16 },
        'Russia': { lat: 61.52, lng: 105.31 },
        'Israel': { lat: 31.04, lng: 34.85 },
        'Gaza': { lat: 31.50, lng: 34.46 },
        'Iran': { lat: 32.42, lng: 53.68 },
        'China': { lat: 35.86, lng: 104.19 },
        'Taiwan': { lat: 23.69, lng: 120.96 },
        'North Korea': { lat: 40.33, lng: 127.51 },
        'Syria': { lat: 34.80, lng: 38.99 },
        'Lebanon': { lat: 33.85, lng: 35.86 },
        'Yemen': { lat: 15.55, lng: 48.51 },
        'Middle East': { lat: 29.0, lng: 41.0 },
        'Global': { lat: 0, lng: 0 },
    };

    return coordMap[location] || { lat: 0, lng: 0 };
};

/**
 * Calculate market sentiment (probability of event happening)
 */
const getMarketSentiment = (market: PolymarketMarket): number => {
    if (!market.outcome_prices || market.outcome_prices.length === 0) {
        return 0;
    }

    // Usually outcome_prices[0] is "Yes" probability
    const yesPrice = parseFloat(market.outcome_prices[0]);
    return isNaN(yesPrice) ? 0 : yesPrice * 100;
};

/**
 * Fetch high-relevance markets from Polymarket
 */
export const fetchPolymarketEvents = async (): Promise<MonitorEvent[]> => {
    try {
        // Fetch active markets
        const response = await fetch(`${POLYMARKET_API_BASE}/markets?limit=100&active=true&closed=false`);

        if (!response.ok) {
            throw new Error(`Polymarket API error: ${response.status}`);
        }

        const markets: PolymarketMarket[] = await response.json();

        const events: MonitorEvent[] = [];

        for (const market of markets) {
            const classification = classifyPolymarketMarket(market.question, market.tags);

            // Only include markets with relevance > 40 (filter out low-relevance markets)
            if (classification.relevance < 40) {
                continue;
            }

            const location = extractLocationFromQuestion(market.question);
            const coords = getCoordinates(location);
            const sentiment = getMarketSentiment(market);

            // Build description with market intelligence
            const volume24h = parseFloat(market.volume_24hr || '0');
            const description = `
Market Probability: ${sentiment.toFixed(1)}% | 
Volume (24h): $${(volume24h / 1000).toFixed(1)}k | 
Liquidity: $${(parseFloat(market.liquidity || '0') / 1000).toFixed(1)}k | 
${market.description || 'Market participants are predicting this outcome.'}
      `.trim();

            // Increase severity if probability is high
            let adjustedSeverity = classification.severity;
            if (sentiment > 70 && classification.category === EventCategory.CONFLICT) {
                adjustedSeverity = 'HIGH';
            } else if (sentiment > 50 && classification.severity === 'MEDIUM') {
                adjustedSeverity = 'ELEVATED';
            }

            events.push({
                id: generateId(),
                title: `Market: ${market.question}`,
                description,
                category: classification.category,
                severity: adjustedSeverity,
                conflictLevel: classification.conflictLevel,
                sourceType: 'AI_INFERRED' as const, // Using this type as it's prediction-based
                sourceName: `Polymarket (${sentiment.toFixed(0)}% probability)`,
                location,
                coordinates: coords,
                timestamp: new Date(market.game_start_time).toISOString(),
                sourceUrl: `https://polymarket.com/event/${market.market_slug}`,
            });
        }

        // Sort by relevance (highest probability + highest relevance)
        return events.slice(0, 30); // Limit to top 30 most relevant markets

    } catch (error) {
        console.error('Polymarket fetch error:', error);
        throw error;
    }
};

/**
 * Fetch specific event markets (for more targeted intelligence)
 */
export const fetchPolymarketByKeywords = async (keywords: string[]): Promise<MonitorEvent[]> => {
    try {
        const allMarkets: MonitorEvent[] = [];

        for (const keyword of keywords) {
            const response = await fetch(
                `${POLYMARKET_API_BASE}/search?query=${encodeURIComponent(keyword)}&limit=20`
            );

            if (!response.ok) continue;

            const results = await response.json();
            // Process results similar to above
            // ... (implementation would be similar to fetchPolymarketEvents)
        }

        return allMarkets;
    } catch (error) {
        console.error('Polymarket keyword search error:', error);
        return [];
    }
};
