/**
 * Conflict Zone Service
 *
 * Reads active conflict zones from Supabase and provides helpers
 * for rendering on the Leaflet map.
 *
 * Zones are manually curated by the admin — they represent ongoing
 * wars, civil wars, invasions, crises, and standoffs worldwide.
 */

import { supabase } from '../lib/supabaseClient';

export type ConflictType =
    | 'WAR'
    | 'CIVIL_WAR'
    | 'INVASION'
    | 'CRISIS'
    | 'STANDOFF'
    | 'INSURGENCY';

export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ConflictZone {
    id: string;
    name: string;
    type: ConflictType;
    severity: ConflictSeverity;
    center_lat: number;
    center_lng: number;
    radius_km: number;
    color: string;
    belligerents: string[];
    description: string;
    start_date: string;
    casualties_estimate?: string;
    displaced_estimate?: string;
    key_developments: string[];
    is_active: boolean;
    updated_at: string;
}

export const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
    WAR: 'GUERRA ATIVA',
    CIVIL_WAR: 'GUERRA CIVIL',
    INVASION: 'INVASÃO',
    CRISIS: 'ZONA DE CRISE',
    STANDOFF: 'TENSÃO MILITAR',
    INSURGENCY: 'INSURGÊNCIA',
};

export const SEVERITY_COLORS: Record<ConflictSeverity, string> = {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#f59e0b',
    LOW: '#84cc16',
};

// ── In-memory cache ─────────────────────────────────────────
let _cache: ConflictZone[] | null = null;
let _cacheTime = 0;
const CACHE_MS = 60 * 60 * 1000; // 1 hour

export async function loadConflictZones(): Promise<ConflictZone[]> {
    if (_cache && Date.now() - _cacheTime < CACHE_MS) return _cache;

    try {
        const { data, error } = await supabase
            .from('conflict_zones')
            .select('*')
            .eq('is_active', true)
            .order('severity', { ascending: false });

        if (error) throw error;

        _cache = (data || []) as ConflictZone[];
        _cacheTime = Date.now();
        return _cache;
    } catch (err) {
        console.warn('[ConflictZones] Failed to load:', err);
        return _cache || [];
    }
}

/** Invalidate cache so next load() fetches fresh data */
export function invalidateConflictZoneCache() {
    _cache = null;
    _cacheTime = 0;
}
