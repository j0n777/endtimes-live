import { MonitorEvent, EventCategory, Severity, ConflictLevel } from '../types';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

interface TelegramMessage {
    message_id: number;
    date: number;
    text?: string;
    caption?: string;
    chat: {
        id: number;
        title?: string;
        username?: string;
    };
    from?: {
        id: number;
        first_name: string;
        username?: string;
    };
    entities?: Array<{
        type: string;
        offset: number;
        length: number;
    }>;
}

interface TelegramChannelPost {
    update_id: number;
    channel_post?: TelegramMessage;
    message?: TelegramMessage;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Classify event from Telegram message text
 */
const classifyTelegramEvent = (text: string): {
    category: EventCategory;
    severity: Severity;
    conflictLevel?: ConflictLevel;
} => {
    const lowerText = text.toLowerCase();

    // Palavras-chave em português e inglês
    const conflictKeywords = [
        'guerra', 'war', 'ataque', 'attack', 'bombardeio', 'bombing',
        'míssil', 'missile', 'invasão', 'invasion', 'conflito', 'conflict',
        'tropas', 'troops', 'militar', 'military', 'combate', 'combat'
    ];

    const disasterKeywords = [
        'terremoto', 'earthquake', 'tsunami', 'furacão', 'hurricane',
        'inundação', 'flood', 'incêndio', 'fire', 'vulcão', 'volcano'
    ];

    const healthKeywords = [
        'pandemia', 'pandemic', 'vírus', 'virus', 'surto', 'outbreak',
        'epidemia', 'epidemic', 'doença', 'disease'
    ];

    const economicKeywords = [
        'crise', 'crisis', 'colapso', 'collapse', 'recessão', 'recession',
        'inflação', 'inflation', 'banco', 'bank'
    ];

    const propheticKeywords = [
        'israel', 'jerusalem', 'jerusalém', 'templo', 'temple',
        'oriente médio', 'middle east', 'profecia', 'prophecy'
    ];

    // Severity keywords
    const highSeverityKeywords = [
        'urgente', 'urgent', 'breaking', 'alerta', 'alert',
        'crítico', 'critical', 'emergência', 'emergency'
    ];

    let category = EventCategory.CONFLICT;
    let severity: Severity = 'MEDIUM';
    let conflictLevel: ConflictLevel | undefined;

    // Determine category
    if (disasterKeywords.some(k => lowerText.includes(k))) {
        category = EventCategory.NATURAL_DISASTER;
    } else if (healthKeywords.some(k => lowerText.includes(k))) {
        category = EventCategory.PANDEMIC;
    } else if (economicKeywords.some(k => lowerText.includes(k))) {
        category = EventCategory.ECONOMIC;
    } else if (propheticKeywords.some(k => lowerText.includes(k))) {
        category = EventCategory.PROPHETIC;
    } else if (conflictKeywords.some(k => lowerText.includes(k))) {
        category = EventCategory.CONFLICT;
        conflictLevel = ConflictLevel.MILITIA_ACTION;
    }

    // Determine severity
    if (highSeverityKeywords.some(k => lowerText.includes(k))) {
        severity = 'HIGH';
    } else if (lowerText.includes('importante') || lowerText.includes('significant')) {
        severity = 'ELEVATED';
    }

    return { category, severity, conflictLevel };
};

/**
 * Extract location from text (simple heuristic)
 */
const extractLocation = (text: string): string => {
    // Common location patterns in Portuguese/English news
    const locationPatterns = [
        /em ([A-Z][a-zá-ú]+(?:\s[A-Z][a-zá-ú]+)?)/,  // "em São Paulo"
        /in ([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,        // "in Ukraine"
        /na ([A-Z][a-zá-ú]+)/,                        // "na Síria"
    ];

    for (const pattern of locationPatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return 'Unknown';
};

/**
 * Get approximate coordinates for a location
 */
const getCoordinatesForLocation = (location: string): { lat: number; lng: number } => {
    const locationMap: Record<string, { lat: number; lng: number }> = {
        // Países e regiões comuns em notícias
        'Brasil': { lat: -14.23, lng: -51.92 },
        'Ukraine': { lat: 48.38, lng: 31.16 },
        'Ucrânia': { lat: 48.38, lng: 31.16 },
        'Israel': { lat: 31.04, lng: 34.85 },
        'Síria': { lat: 34.80, lng: 38.99 },
        'Syria': { lat: 34.80, lng: 38.99 },
        'Irã': { lat: 32.42, lng: 53.68 },
        'Iran': { lat: 32.42, lng: 53.68 },
        'Rússia': { lat: 61.52, lng: 105.31 },
        'Russia': { lat: 61.52, lng: 105.31 },
        'China': { lat: 35.86, lng: 104.19 },
        'Taiwan': { lat: 23.69, lng: 120.96 },
        'Coreia': { lat: 37.56, lng: 126.97 },
        'Korea': { lat: 37.56, lng: 126.97 },
        'Gaza': { lat: 31.50, lng: 34.46 },
        'Líbano': { lat: 33.85, lng: 35.86 },
        'Lebanon': { lat: 33.85, lng: 35.86 },
        'Unknown': { lat: 0, lng: 0 },
    };

    // Try exact match
    if (locationMap[location]) {
        return locationMap[location];
    }

    // Try partial match
    for (const [key, coords] of Object.entries(locationMap)) {
        if (location.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(location.toLowerCase())) {
            return coords;
        }
    }

    return { lat: 0, lng: 0 };
};

/**
 * Fetch recent messages from Telegram channels
 */
export const fetchTelegramChannelPosts = async (
    botToken: string,
    channelIds: string[]
): Promise<MonitorEvent[]> => {
    if (!botToken || channelIds.length === 0) {
        throw new Error('Telegram bot token and at least one channel ID are required');
    }

    const allEvents: MonitorEvent[] = [];

    for (const channelId of channelIds) {
        try {
            // Get channel updates (last 100 messages)
            const url = `${TELEGRAM_API_BASE}${botToken}/getUpdates?limit=100&allowed_updates=["channel_post","message"]`;

            const response = await fetch(url);

            if (!response.ok) {
                console.error(`Telegram API error for ${channelId}: ${response.status}`);
                continue;
            }

            const data = await response.json();

            if (!data.ok || !data.result) {
                console.error(`Telegram API returned error for ${channelId}`);
                continue;
            }

            const updates: TelegramChannelPost[] = data.result;

            // Filter messages from the last 24 hours
            const oneDayAgo = Date.now() / 1000 - 24 * 60 * 60;

            const recentPosts = updates
                .map(u => u.channel_post || u.message)
                .filter(post =>
                    post &&
                    post.date > oneDayAgo &&
                    (post.text || post.caption)
                ) as TelegramMessage[];

            // Convert to MonitorEvents
            for (const post of recentPosts.slice(0, 20)) { // Limit to 20 most recent
                const text = post.text || post.caption || '';
                if (text.length < 20) continue; // Skip very short messages

                const classification = classifyTelegramEvent(text);
                const location = extractLocation(text);
                const coords = getCoordinatesForLocation(location);

                // Extract title (first line or first 100 chars)
                const title = text.split('\n')[0].substring(0, 100);

                allEvents.push({
                    id: generateId(),
                    title: title || 'Telegram Channel Update',
                    description: text.substring(0, 300) + (text.length > 300 ? '...' : ''),
                    category: classification.category,
                    severity: classification.severity,
                    conflictLevel: classification.conflictLevel,
                    sourceType: 'TELEGRAM' as const,
                    sourceName: post.chat.title || post.chat.username || 'Telegram Channel',
                    location,
                    coordinates: coords,
                    timestamp: new Date(post.date * 1000).toISOString(),
                    sourceUrl: post.chat.username
                        ? `https://t.me/${post.chat.username}/${post.message_id}`
                        : undefined,
                });
            }

        } catch (error) {
            console.error(`Error fetching Telegram channel ${channelId}:`, error);
        }
    }

    return allEvents;
};

/**
 * Test bot token validity
 */
export const testTelegramBotToken = async (botToken: string): Promise<boolean> => {
    try {
        const url = `${TELEGRAM_API_BASE}${botToken}/getMe`;
        const response = await fetch(url);
        const data = await response.json();
        return data.ok === true;
    } catch (error) {
        return false;
    }
};
