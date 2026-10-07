// Coleta do alerta de apocalipse: duas chamadas ao adsb.lol por rodada.
import { appendSample, assessCohort } from './stats';
import type { EwsPayload, EwsSample } from './types';

// Jatos executivos por designador ICAO (Doc 8643). Os nomes foram conferidos na base
// de tipos do tar1090-db (wiedehopf/tar1090-db, db/icao_aircraft_types2.js) em
// 07/10/2026; cada um voltou com aeronaves no ar no adsb.lol. Ficou de fora o E135
// (regional de linha aérea).
export const BUSINESS_JET_TYPES = [
    'GLF4', 'GLF5', 'GLF6', 'GA5C', 'GA6C', 'GA7C', 'GA8C', 'G280', 'G150', 'GALX', 'ASTR', // Gulfstream
    'GLEX', 'GL5T', 'GL7T', 'CL30', 'CL35', 'CL60',                                       // Bombardier
    'C500', 'C501', 'C525', 'C25A', 'C25B', 'C25C', 'C25M', 'C550', 'C551', 'C560',      // Cessna Citation
    'C56X', 'C650', 'C680', 'C68A', 'C700', 'C750',
    'E50P', 'E55P', 'E545', 'E550', 'E35L',                                               // Embraer
    'F2TH', 'F900', 'FA7X', 'FA8X', 'FA6X', 'FA50', 'FA10',                               // Dassault Falcon
    'LJ31', 'LJ35', 'LJ40', 'LJ45', 'LJ55', 'LJ60', 'LJ70', 'LJ75',                       // Learjet
    'H25A', 'H25B', 'H25C', 'HA4T', 'BE40', 'BE4W', 'PRM1', 'MU30',                       // Hawker/Beech
    'PC24', 'HDJT', 'SF50', 'EA50', 'WW24',                                               // outros
];

export const EWS_TIME_ZONE = 'America/New_York'; // a aviação executiva é majoritariamente americana
export const EWS_MIN_WEEKS = 3;
export const EWS_KEEP_DAYS = 70;
const API = 'https://api.adsb.lol/v2';

interface AdsbAircraft { alt_baro?: number | string; seen?: number; dbFlags?: number }

/** No ar = altitude barométrica informada (não "ground") e visto no último minuto. */
export function countAirborne(ac: AdsbAircraft[], { excludeMilitary = false } = {}): number {
    return ac.filter(a =>
        a.alt_baro !== undefined && a.alt_baro !== 'ground'
        && (a.seen ?? 0) <= 60
        && !(excludeMilitary && ((a.dbFlags ?? 0) & 1))).length;
}

async function fetchAircraft(path: string): Promise<AdsbAircraft[]> {
    const res = await fetch(`${API}/${path}`, {
        headers: { 'User-Agent': 'endtimes.live (+https://endtimes.live)' },
        signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`adsb.lol ${path.split('/')[0]} respondeu ${res.status}`);
    const body = await res.json();
    return Array.isArray(body?.ac) ? body.ac : [];
}

async function safeCount(label: string, fn: () => Promise<number>): Promise<number | null> {
    try {
        return await fn();
    } catch (err) {
        console.warn(`⚠️ EWS: ${label} falhou: ${err instanceof Error ? err.message : err}`);
        return null;
    }
}

export async function sampleNow(now: Date): Promise<EwsSample> {
    const [jets, military] = await Promise.all([
        // Aeronaves militares com tipo executivo (C-37, C-21…) contam só no grupo militar.
        safeCount('jatos', async () => countAirborne(await fetchAircraft(`type/${BUSINESS_JET_TYPES.join(',')}`), { excludeMilitary: true })),
        safeCount('militares', async () => countAirborne(await fetchAircraft('mil'))),
    ]);
    return { t: now.toISOString(), jets, military };
}

export function computeEws(history: EwsSample[], sample: EwsSample, now: Date): { payload: EwsPayload; history: EwsSample[] } {
    const payload: EwsPayload = {
        version: 1,
        generatedAt: now.toISOString(),
        timeZone: EWS_TIME_ZONE,
        minWeeks: EWS_MIN_WEEKS,
        source: 'adsb.lol (ODbL)',
        sourceUrl: 'https://adsb.lol/',
        cohorts: (['jets', 'military'] as const).map(id =>
            assessCohort(id, sample[id], history, now, EWS_TIME_ZONE, EWS_MIN_WEEKS)),
    };
    return { payload, history: appendSample(history, sample, EWS_KEEP_DAYS) };
}
