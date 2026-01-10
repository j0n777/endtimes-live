import { MonitorEvent, AdminConfig, DataSourceStatus } from '../types';
import { fetchGDACSEvents } from './gdacs-service';
import { fetchNASAEONETEvents } from './nasa-eonet-service';
import { fetchACLEDEvents } from './acled-service';
import { fetchWHOEvents } from './who-service';
import { fetchGDELTEvents } from './gdelt-service';
import { fetchNASAFIRMSEvents } from './nasa-firms-service';
import { fetchTelegramChannelPosts } from './telegram-service';
import { fetchPolymarketEvents } from './polymarket-service';
import { fetchVIXEvents } from './vix-service';
import { fetchEmbassyWarnings } from './embassy-service';
import { fetchNOTAMEvents } from './notam-service';
import { fetchInternetShutdowns } from './internet-shutdown-service';
import { fetchCyberAttacks } from './cyber-attack-service';

// Cache structure
interface CacheEntry {
    data: MonitorEvent[];
    timestamp: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

type DataSourceFetcher = () => Promise<MonitorEvent[]>;

interface DataSource {
    name: string;
    fetcher: DataSourceFetcher;
    enabled: boolean;
    requiresAuth: boolean;
}

const getFromCache = (key: string): MonitorEvent[] | null => {
    const entry = cache[key];
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
        delete cache[key];
        return null;
    }

    return entry.data;
};

const setCache = (key: string, data: MonitorEvent[]): void => {
    cache[key] = {
        data,
        timestamp: Date.now(),
    };
};

/**
 * Fetch events from all configured data sources
 */
export const fetchAllDataSources = async (
    config?: AdminConfig
): Promise<{
    events: MonitorEvent[];
    statuses: DataSourceStatus[];
}> => {
    const statuses: DataSourceStatus[] = [];
    const eventPromises: Promise<{ source: string; events: MonitorEvent[] }>[] = [];

    // Define all data sources with their configurations
    const sources: DataSource[] = [
        {
            name: 'GDACS',
            fetcher: async () => {
                const cached = getFromCache('gdacs');
                if (cached) return cached;
                const events = await fetchGDACSEvents();
                setCache('gdacs', events);
                return events;
            },
            enabled: config?.gdacsEnabled !== false, // Enabled by default
            requiresAuth: false,
        },
        {
            name: 'NASA EONET',
            fetcher: async () => {
                const cached = getFromCache('nasa-eonet');
                if (cached) return cached;
                const events = await fetchNASAEONETEvents(config?.nasaEonetApiKey);
                setCache('nasa-eonet', events);
                return events;
            },
            enabled: config?.nasaEonetApiKey !== undefined || true, // Works without key too
            requiresAuth: false,
        },
        {
            name: 'ACLED',
            fetcher: async () => {
                if (!config?.acledApiKey || !config?.acledEmail) {
                    throw new Error('ACLED requires API key and email');
                }
                const cached = getFromCache('acled');
                if (cached) return cached;
                const events = await fetchACLEDEvents(config.acledApiKey, config.acledEmail);
                setCache('acled', events);
                return events;
            },
            enabled: Boolean(config?.acledApiKey && config?.acledEmail),
            requiresAuth: true,
        },
        {
            name: 'WHO',
            fetcher: async () => {
                const cached = getFromCache('who');
                if (cached) return cached;
                const events = await fetchWHOEvents();
                setCache('who', events);
                return events;
            },
            enabled: config?.whoEnabled !== false, // Enabled by default
            requiresAuth: false,
        },
        {
            name: 'GDELT',
            fetcher: async () => {
                const cached = getFromCache('gdelt');
                if (cached) return cached;
                const events = await fetchGDELTEvents();
                setCache('gdelt', events);
                return events;
            },
            enabled: config?.gdeltEnabled !== false, // Enabled by default
            requiresAuth: false,
        },
        {
            name: 'NASA FIRMS',
            fetcher: async () => {
                if (!config?.nasaFirmsApiKey) {
                    throw new Error('NASA FIRMS requires API key');
                }
                const cached = getFromCache('nasa-firms');
                if (cached) return cached;
                const events = await fetchNASAFIRMSEvents(config.nasaFirmsApiKey);
                setCache('nasa-firms', events);
                return events;
            },
            enabled: Boolean(config?.nasaFirmsApiKey), // Re-enabled with intelligent filter
            requiresAuth: true,
        },
        {
            name: 'Telegram',
            fetcher: async () => {
                if (!config?.telegramBotToken || !config?.telegramChannelIds || config.telegramChannelIds.length === 0) {
                    throw new Error('Telegram requires bot token and channel IDs');
                }
                const cached = getFromCache('telegram');
                if (cached) return cached;
                const events = await fetchTelegramChannelPosts(config.telegramBotToken, config.telegramChannelIds);
                setCache('telegram', events);
                return events;
            },
            enabled: Boolean(config?.telegramBotToken && config?.telegramChannelIds && config.telegramChannelIds.length > 0),
            requiresAuth: true,
        },
        {
            name: 'Polymarket',
            fetcher: async () => {
                const cached = getFromCache('polymarket');
                if (cached) return cached;
                const events = await fetchPolymarketEvents();
                setCache('polymarket', events);
                return events;
            },
            enabled: config?.polymarketEnabled !== false, // Enabled by default
            requiresAuth: false,
        },
        {
            name: 'VIX Index',
            fetcher: async () => {
                const cached = getFromCache('vix');
                if (cached) return cached;
                const events = await fetchVIXEvents();
                setCache('vix', events);
                return events;
            },
            enabled: true, // Always enabled (market fear indicator)
            requiresAuth: false,
        },
        {
            name: 'Embassy Warnings',
            fetcher: async () => {
                const cached = getFromCache('embassy');
                if (cached) return cached;
                const events = await fetchEmbassyWarnings();
                setCache('embassy', events);
                return events;
            },
            enabled: true, // Always enabled (travel advisories)
            requiresAuth: false,
        },
        {
            name: 'NOTAMs',
            fetcher: async () => {
                const cached = getFromCache('notams');
                if (cached) return cached;
                const events = await fetchNOTAMEvents();
                setCache('notams', events);
                return events;
            },
            enabled: true, // Always enabled (airspace restrictions)
            requiresAuth: false,
        },
        {
            name: 'Internet Shutdowns',
            fetcher: async () => {
                const cached = getFromCache('internet-shutdowns');
                if (cached) return cached;
                const events = await fetchInternetShutdowns();
                setCache('internet-shutdowns', events);
                return events;
            },
            enabled: true, // Always enabled (critical infrastructure)
            requiresAuth: false,
        },
        {
            name: 'Cyber Attacks',
            fetcher: async () => {
                const cached = getFromCache('cyber-attacks');
                if (cached) return cached;
                const events = await fetchCyberAttacks();
                setCache('cyber-attacks', events);
                return events;
            },
            enabled: true, // Always enabled (security threats)
            requiresAuth: false,
        },
    ];

    // Fetch from all enabled sources
    for (const source of sources) {
        if (!source.enabled) {
            statuses.push({
                name: source.name,
                status: 'disabled',
                eventCount: 0,
            });
            continue;
        }

        eventPromises.push(
            source.fetcher()
                .then(events => ({ source: source.name, events }))
                .catch(error => {
                    console.error(`${source.name} fetch failed:`, error);
                    return { source: source.name, events: [] as MonitorEvent[] };
                })
        );
    }

    // Execute all fetches in parallel
    const results = await Promise.allSettled(eventPromises);

    const allEvents: MonitorEvent[] = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const { source, events } = result.value;
            allEvents.push(...events);

            statuses.push({
                name: source,
                status: 'active',
                lastFetch: new Date().toISOString(),
                eventCount: events.length,
            });
        } else {
            const sourceName = sources.filter(s => s.enabled)[index]?.name || 'Unknown';
            statuses.push({
                name: sourceName,
                status: 'error',
                lastFetch: new Date().toISOString(),
                eventCount: 0,
                error: result.reason?.message || 'Unknown error',
            });
        }
    });

    // Deduplicate events by similarity
    const uniqueEvents = deduplicateEvents(allEvents);

    return {
        events: uniqueEvents,
        statuses,
    };
};

/**
 * Simple deduplication based on title and location similarity
 */
const deduplicateEvents = (events: MonitorEvent[]): MonitorEvent[] => {
    const seen = new Set<string>();
    const unique: MonitorEvent[] = [];

    for (const event of events) {
        // Create a simple hash from title + location
        const hash = `${event.title.toLowerCase().slice(0, 50)}_${Math.round(event.coordinates.lat * 10)}_${Math.round(event.coordinates.lng * 10)}`;

        if (!seen.has(hash)) {
            seen.add(hash);
            unique.push(event);
        }
    }

    return unique;
};

/**
 * Clear all caches (useful for forcing refresh)
 */
export const clearDataSourceCache = (): void => {
    Object.keys(cache).forEach(key => delete cache[key]);
};

/**
 * Get cache status
 */
export const getCacheStatus = (): Record<string, { age: number; count: number }> => {
    const now = Date.now();
    const status: Record<string, { age: number; count: number }> = {};

    Object.entries(cache).forEach(([key, entry]) => {
        status[key] = {
            age: Math.floor((now - entry.timestamp) / 1000), // seconds
            count: entry.data.length,
        };
    });

    return status;
};
