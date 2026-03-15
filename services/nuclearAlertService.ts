/**
 * Nuclear Alert Service
 *
 * Loads nuclear strike alerts from Supabase and computes blast-radius
 * zones using standard nuclear weapons scaling laws (NUKEMAP-compatible).
 *
 * Blast radius formulas (cube-root scaling law for nuclear air-burst):
 *   All radii in kilometres, yield (W) in kilotons.
 *   Source: "The Effects of Nuclear Weapons", Glasstone & Dolan (1977)
 *           + NUKEMAP scaling approximations.
 *
 * Zone order (largest → smallest, so inner circles render on top):
 *   6. Fallout zone    (purple)   — 1000+ mSv lethal radiation
 *   5. Light blast     (lime)     — 1 psi: windows broken, glass injuries
 *   4. Thermal         (yellow)   — 3rd-degree burns on exposed skin
 *   3. Moderate blast  (amber)    — 5 psi: severe structural damage
 *   2. Heavy blast     (orange)   — 20 psi: reinforced concrete destroyed
 *   1. Fireball        (red)      — immediate vaporization
 */

import { supabase } from '../lib/supabaseClient';

export interface NuclearAssessment {
    strategic_implications: string;
    immediate_effects: string;
    population_at_risk: string;
    regional_impact: string;
    recommended_actions: string;
}

export interface NuclearAlert {
    id: string;
    title: string;
    lat: number;
    lng: number;
    yield_kt: number;
    weapon_name: string;
    attacker: string;
    defender: string;
    target_city: string;
    target_country: string;
    detonation_time: string;
    verified: boolean;
    ai_assessment?: NuclearAssessment;
    is_active: boolean;
}

export interface BlastZone {
    name: string;
    description: string;
    radius_km: number;
    radius_m: number;
    color: string;
    fillOpacity: number;
    borderOpacity: number;
}

/**
 * Compute the 6 standard blast zones for a given nuclear yield.
 * Returns zones sorted largest→smallest (for correct Leaflet rendering).
 */
export function calculateBlastZones(yield_kt: number): BlastZone[] {
    const w = Math.max(yield_kt, 0.001);

    const zones: BlastZone[] = [
        {
            name: 'Zona de Fallout',
            description: 'Radiação letal (1000+ mSv). Evacuação imediata obrigatória. Contaminação prolongada.',
            radius_km: +(3.0 * Math.pow(w, 0.333)).toFixed(3),
            color: '#7c3aed',
            fillOpacity: 0.07,
            borderOpacity: 0.45,
        },
        {
            name: 'Pressão Leve (1 psi)',
            description: 'Vidros estilhaçados, dano estrutural leve. Ferimentos por estilhaços. Incêndios secundários.',
            radius_km: +(1.7 * Math.pow(w, 0.333)).toFixed(3),
            color: '#84cc16',
            fillOpacity: 0.10,
            borderOpacity: 0.50,
        },
        {
            name: 'Radiação Térmica',
            description: 'Queimaduras de 3º grau em pele exposta. Risco de tempestade de fogo.',
            radius_km: +(1.2 * Math.pow(w, 0.41)).toFixed(3),
            color: '#facc15',
            fillOpacity: 0.13,
            borderOpacity: 0.55,
        },
        {
            name: 'Pressão Moderada (5 psi)',
            description: 'Colapso de edificações. Mortalidade em massa. Infraestrutura severamente danificada.',
            radius_km: +(0.65 * Math.pow(w, 0.333)).toFixed(3),
            color: '#f59e0b',
            fillOpacity: 0.18,
            borderOpacity: 0.60,
        },
        {
            name: 'Pressão Pesada (20 psi)',
            description: 'Concreto armado destruído. Mortalidade extremamente alta. Subterrâneos afetados.',
            radius_km: +(0.28 * Math.pow(w, 0.333)).toFixed(3),
            color: '#ea580c',
            fillOpacity: 0.28,
            borderOpacity: 0.70,
        },
        {
            name: 'Bola de Fogo',
            description: 'Vaporização imediata. Sobrevivência impossível. Temperatura: milhões de °C.',
            radius_km: +(0.071 * Math.pow(w, 0.41)).toFixed(3),
            color: '#dc2626',
            fillOpacity: 0.65,
            borderOpacity: 0.90,
        },
    ].map(z => ({ ...z, radius_m: Math.round(z.radius_km * 1000) }));

    // Filter out imperceptible zones (< 10 meters — can't be seen on map)
    return zones.filter(z => z.radius_m > 10);
}

/** Human-readable yield description */
export function yieldToLabel(yield_kt: number): string {
    if (yield_kt >= 1000) return `${(yield_kt / 1000).toFixed(1)} MT (megatons)`;
    if (yield_kt >= 1) return `${yield_kt.toFixed(1)} kt (kilotons)`;
    return `${(yield_kt * 1000).toFixed(0)} ton`;
}

// ── Data loading ────────────────────────────────────────────
export async function loadNuclearAlerts(): Promise<NuclearAlert[]> {
    try {
        const { data, error } = await supabase
            .from('nuclear_alerts')
            .select('*')
            .eq('is_active', true)
            .order('detonation_time', { ascending: false });

        if (error) throw error;
        return (data || []) as NuclearAlert[];
    } catch (err) {
        console.warn('[NuclearAlerts] Failed to load:', err);
        return [];
    }
}
