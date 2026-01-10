// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bimfztwwzuwwefxfkkwe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbWZ6dHd3enV3d2VmeGZra3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MjgyMTEsImV4cCI6MjA1MjEwNDIxMX0.Pii9LrLVVl_-NPeoQulKQA_E6lx5uXv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false // No authentication needed for public read
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'x-application-name': 'end-times-monitor'
        }
    }
});

// Types for database
export interface EventRow {
    id: string;
    lat: number;
    lng: number;
    category: string;
    severity: 'LOW' | 'MEDIUM' | 'ELEVATED' | 'HIGH';
    title: string;
    description?: string;
    location?: string;
    source_name?: string;
    source_type?: string;
    source_url?: string;
    conflict_level?: string;
    event_timestamp: string;
    created_at: string;
    updated_at: string;
    metadata?: any;
}

export interface EventSourceRow {
    id: string;
    name: string;
    type: string;
    enabled: boolean;
    last_fetch?: string;
    last_status?: string;
    error_message?: string;
    event_count: number;
    config?: any;
    created_at: string;
    updated_at: string;
}

// Lightweight marker data (for initial map load)
export interface MarkerData {
    id: string;
    lat: number;
    lng: number;
    category: string;
    severity: string;
}

/**
 * Fetch lightweight markers for map viewport
 * Returns ONLY coordinates + minimal data (5KB for 200 markers)
 */
export async function fetchMarkersInBounds(bounds: {
    south: number;
    north: number;
    west: number;
    east: number;
}) {
    const { data, error } = await supabase
        .from('events')
        .select('id, lat, lng, category, severity')
        .gte('lat', bounds.south)
        .lte('lat', bounds.north)
        .gte('lng', bounds.west)
        .lte('lng', bounds.east)
        .order('severity', { ascending: false })
        .limit(200); // Max 200 markers in viewport

    if (error) {
        console.error('Supabase fetch markers error:', error);
        return [];
    }

    return data as MarkerData[];
}

/**
 * Fetch full event details (on-demand when marker clicked)
 * Returns complete event data (~2KB)
 */
export async function fetchEventDetails(eventId: string) {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (error) {
        console.error('Supabase fetch event details error:', error);
        return null;
    }

    return data as EventRow;
}

/**
 * Fetch priority threats (paginated)
 */
export async function fetchPriorityThreats(page: number = 0, limit: number = 10) {
    const start = page * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .in('severity', ['HIGH', 'ELEVATED'])
        .order('event_timestamp', { ascending: false })
        .range(start, end);

    if (error) {
        console.error('Supabase fetch priority threats error:', error);
        return { events: [], total: 0 };
    }

    return {
        events: data as EventRow[],
        total: count || 0,
        hasMore: (count || 0) > end + 1
    };
}

/**
 * Insert or update event
 * (Service role only - for data ingestion)
 */
export async function upsertEvent(event: Partial<EventRow>) {
    const { data, error } = await supabase
        .from('events')
        .upsert(event, {
            onConflict: 'id'
        })
        .select()
        .single();

    if (error) {
        console.error('Supabase upsert event error:', error);
        return null;
    }

    return data as EventRow;
}

/**
 * Batch insert events
 * (For data migration from existing sources)
 */
export async function batchInsertEvents(events: Partial<EventRow>[]) {
    const { data, error } = await supabase
        .from('events')
        .insert(events)
        .select();

    if (error) {
        console.error('Supabase batch insert error:', error);
        return [];
    }

    return data as EventRow[];
}

export default supabase;
