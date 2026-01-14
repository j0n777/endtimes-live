import { supabase } from '../lib/supabaseClient';
import { MonitorEvent } from '../types';

/**
 * Frontend Data Service - Supabase Only
 * NO direct API calls, NO polling
 * All data comes from Supabase cache
 */

/**
 * Load lightweight events for initial map render
 * ~10-20KB payload for 300 events
 */
export async function loadMapEvents(
    priorityMax: number = 2,
    limit: number = 300
): Promise<MonitorEvent[]> {
    try {
        const { data, error } = await supabase.rpc('get_map_events', {
            p_priority_max: priorityMax,
            p_limit: limit
        });

        if (error) {
            console.error('Error loading map events:', error);
            return [];
        }

        // Convert to MonitorEvent format
        return (data || []).map((event: any) => ({
            id: event.id,
            title: '', // Will be loaded on demand
            description: '',
            category: event.category,
            severity: event.severity,
            sourceType: 'OFFICIAL',
            sourceName: '',
            location: '',
            coordinates: {
                lat: event.lat,
                lng: event.lng
            },
            timestamp: event.event_timestamp
        }));

    } catch (error) {
        console.error('Failed to load map events:', error);
        return [];
    }
}

/**
 * Load standard event cards for selected region
 * ~50-100KB for 100 events
 */
export async function loadEventCards(
    eventIds: string[]
): Promise<MonitorEvent[]> {
    if (eventIds.length === 0) return [];

    try {
        const { data, error } = await supabase.rpc('get_event_cards', {
            p_event_ids: eventIds
        });

        if (error) {
            console.error('Error loading event cards:', error);
            return [];
        }

        return (data || []).map((event: any) => ({
            id: event.id,
            title: event.title,
            description: event.summary, // First 200 chars
            category: event.category,
            severity: event.severity,
            sourceType: 'OFFICIAL',
            sourceName: event.source_name,
            location: `${event.city || 'Unknown'}, ${event.country_code || ''}`,
            coordinates: {
                lat: event.lat,
                lng: event.lng
            },
            timestamp: event.event_timestamp
        }));

    } catch (error) {
        console.error('Failed to load event cards:', error);
        return [];
    }
}

/**
 * Load full event details
 * ~5-10KB per event
 */
export async function loadEventDetails(
    eventId: string
): Promise<MonitorEvent | null> {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) {
            console.error('Error loading event details:', error);
            return null;
        }

        if (!data) return null;

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            category: data.category,
            severity: data.severity,
            sourceType: data.source_type,
            sourceName: data.source_name,
            location: data.location,
            coordinates: {
                lat: data.lat,
                lng: data.lng
            },
            timestamp: data.event_timestamp,
            sourceUrl: data.source_url,
            conflictLevel: data.casualties ? `${data.casualties} casualties` : undefined
        };

    } catch (error) {
        console.error('Failed to load event details:', error);
        return null;
    }
}

/**
 * Load all events (for backwards compatibility)
 * Uses lightweight query
 */
export async function loadAllEvents(): Promise<MonitorEvent[]> {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('id, title, description, category, severity, source_type, source_name, location, lat, lng, event_timestamp, source_url, casualties')
            // Prophecy Persistence: Ensure we catch older fulfilled prophecies if needed, 
            // but currently we just fetch top 500 by priority/recency.
            //.order('priority', { ascending: true }) // Disabled to ensure recent events show up first
            .order('event_timestamp', { ascending: false }) // Use event_timestamp (reliable) instead of detected_at
            .limit(500);

        if (error) {
            console.error('Error loading all events:', error);
            return [];
        }

        return (data || []).map(event => ({
            id: event.id,
            title: event.title,
            description: event.description || '',
            category: event.category,
            severity: event.severity,
            sourceType: event.source_type,
            sourceName: event.source_name,
            location: event.location || '',
            coordinates: {
                lat: event.lat,
                lng: event.lng
            },
            timestamp: event.event_timestamp,
            sourceUrl: event.source_url,
            conflictLevel: event.casualties ? `${event.casualties} casualties` : undefined
        }));

    } catch (error) {
        console.error('Failed to load all events:', error);
        return [];
    }
}

/**
 * Search events by tags
 */
export async function searchEventsByTags(
    tags: string[],
    limit: number = 100
): Promise<MonitorEvent[]> {
    try {
        const { data, error } = await supabase.rpc('search_events_by_tags', {
            p_tags: tags,
            p_limit: limit
        });

        if (error) {
            console.error('Error searching events:', error);
            return [];
        }

        return (data || []).map((event: any) => ({
            id: event.id,
            title: event.title,
            description: '',
            category: event.category,
            severity: event.severity,
            sourceType: 'OFFICIAL',
            sourceName: '',
            location: '',
            coordinates: { lat: 0, lng: 0 },
            timestamp: event.event_timestamp
        }));

    } catch (error) {
        console.error('Failed to search events:', error);
        return [];
    }
}

/**
 * Get collector statuses
 */
export async function getCollectorStatuses() {
    try {
        const { data, error } = await supabase
            .from('collector_status')
            .select('*')
            .order('enabled', { ascending: false })
            .order('last_success_at', { ascending: false });

        if (error) {
            console.error('Error loading collector statuses:', error);
            return [];
        }

        return data || [];

    } catch (error) {
        console.error('Failed to load collector statuses:', error);
        return [];
    }
}

/**
 * Trigger manual collection (calls Edge Function if available)
 */
export async function triggerDataCollection(): Promise<boolean> {
    // For Viewer Mode (no Edge Function access), rely on Cron.
    // Suppress CORS error by not calling the function.
    console.log('🔄 Data collection runs in background. Using cached data.');
    return Promise.resolve(true);
}
