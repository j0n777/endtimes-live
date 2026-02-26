import { MonitorEvent, AdminConfig, DataSourceStatus, Severity } from '../types';
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
import { getCuratedPOIs } from './osm-poi-service';
import { fetchWeatherAlerts } from './weather-alerts-service';
import { fetchTwitterEvents } from './twitter-service';
import { fetchAviationEvents } from './aviation-service';

// Cache structure
interface CacheEntry {
    data: MonitorEvent[];
    timestamp: number;
}


const CACHE_KEY_PREFIX = 'monitor_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to get from LocalStorage
const getFromCache = (key: string): MonitorEvent[] | null => {
    try {
        const item = localStorage.getItem(CACHE_KEY_PREFIX + key);
        if (!item) return null;

        const entry: CacheEntry = JSON.parse(item);
        const now = Date.now();

        if (now - entry.timestamp > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY_PREFIX + key);
            return null;
        }

        return entry.data;
    } catch (e) {
        console.warn('Cache read error', e);
        return null;
    }
};

// Helper to set to LocalStorage
const setCache = (key: string, data: MonitorEvent[]): void => {
    try {
        const entry: CacheEntry = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
        console.warn('Cache write error - storage likely full', e);
        // If quota exceeded, try clearing old items or just fail silently for this session
    }
};

/**
 * Clear all caches (useful for forcing refresh)
 */
export const clearDataSourceCache = (): void => {
    // Clear only our keys
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
};

type DataSourceFetcher = () => Promise<MonitorEvent[]>;

interface DataSource {
    name: string;
    fetcher: DataSourceFetcher;
    enabled: boolean;
    requiresAuth: boolean;
}

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
            name: 'X (Twitter) OSINT',
            fetcher: async () => {
                const cached = getFromCache('x-twitter');
                if (cached) return cached;
                const events = await fetchTwitterEvents(config?.twitterKeywords);
                setCache('x-twitter', events);
                return events;
            },
            enabled: config?.twitterEnabled !== false, // Enabled by default
            requiresAuth: false,
        },
        {
            name: 'Military Aviation',
            fetcher: async () => {
                const cached = getFromCache('aviation-military');
                if (cached) return cached;
                const events = await fetchAviationEvents();
                setCache('aviation-military', events);
                return events;
            },
            enabled: config?.aviationEnabled !== false, // Enabled by default
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
        {
            name: 'Survival POIs',
            fetcher: async () => {
                const cached = getFromCache('survival-pois');
                if (cached) return cached;
                const events = getCuratedPOIs();
                setCache('survival-pois', events);
                return events;
            },
            enabled: config?.poisEnabled !== false, // Can be toggled
            requiresAuth: false,
        },
        {
            name: 'Weather Alerts',
            fetcher: async () => {
                const cached = getFromCache('weather-alerts');
                if (cached) return cached;
                const events = await fetchWeatherAlerts({
                    nwsEnabled: config?.nwsEnabled,
                    weatherbitApiKey: config?.weatherbitApiKey,
                    weatherbitEnabled: config?.weatherbitEnabled
                });
                setCache('weather-alerts', events);
                return events;
            },
            enabled: config?.nwsEnabled !== false || config?.weatherbitEnabled === true, // NWS enabled by default
            requiresAuth: false, // NWS doesn't require auth, Weatherbit is optional
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

    // Map to preserve order and name for statuses
    const activeSources = sources.filter(s => s.enabled);

    // Fix: Correctly map results to sources status
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
            // Try to identify the source that failed (approximate by index in the pushed array)
            // This index matches the pushed Promise order
            // Note: Promise.allSettled preserves order of the input array.
            // Our input array `eventPromises` corresponds 1:1 with `activeSources`.
            const failedSource = activeSources[index];

            statuses.push({
                name: failedSource.name,
                status: 'error',
                lastFetch: new Date().toISOString(),
                eventCount: 0,
                error: result.reason?.message || 'Unknown error',
            });
        }
    });

    // Deduplicate events by similarity
    const uniqueEvents = deduplicateEvents(allEvents);

    // ⭐ PROGRESSIVE LOADING: Limit initial load, prioritize by severity
    // Sort by severity (HIGH first) then by timestamp (recent first)
    const prioritized = uniqueEvents.sort((a, b) => {
        const severityOrder: Record<Severity, number> = {
            'HIGH': 0,
            'ELEVATED': 1,
            'MEDIUM': 2,
            'LOW': 3
        };

        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;

        // If same severity, sort by timestamp (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Limit to 2000 most important events initially
    const MAX_INITIAL_EVENTS = 2000;
    const limited = prioritized.slice(0, MAX_INITIAL_EVENTS);

    if (prioritized.length > MAX_INITIAL_EVENTS) {
        console.warn(`⚠️ Loaded ${MAX_INITIAL_EVENTS}/${prioritized.length} events (${prioritized.length - MAX_INITIAL_EVENTS} deferred)`);
    }

    return {
        events: limited,
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
 * Get cache status
 */
export const getCacheStatus = (): Record<string, { age: number; count: number }> => {
    const now = Date.now();
    const status: Record<string, { age: number; count: number }> = {};

    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
            try {
                const item = localStorage.getItem(key);
                if (item) {
                    const entry: CacheEntry = JSON.parse(item);
                    const sourceName = key.replace(CACHE_KEY_PREFIX, '');
                    status[sourceName] = {
                        age: Math.floor((now - entry.timestamp) / 1000), // seconds
                        count: entry.data.length,
                    };
                }
            } catch (e) {
                // Ignore malformed
            }
        }
    });

    return status;
};
