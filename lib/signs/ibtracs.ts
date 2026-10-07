// Ciclones tropicais fortes a partir do NOAA IBTrACS (07/10/2026), para o sinal "bramido
// do mar". Acesso aberto; o uso comercial segue a Resolução 40 da OMM. Substitui o GDACS,
// que não publica licença de reuso. Um "ciclone forte" é a primeira vez que a tempestade
// chega à categoria 3+ na escala Saffir-Simpson (coluna USA_SSHS, disponível em todas
// as bacias via JTWC/NHC). Trajetórias "spur" (ramificações) não contam.

export interface StormCatalog {
    version: 1;
    builtAt: string;
    sourceModified: string | null; // Last-Modified do arquivo last3years usado por último
    storms: Record<string, string>; // SID → data (YYYY-MM-DD) em que chegou à categoria 3
}

/** Lê o CSV do IBTrACS e devolve SID → primeira data com USA_SSHS ≥ 3, e a menor data do arquivo. */
export function majorStormsFromCsv(text: string): { storms: Record<string, string>; firstDate: string | null } {
    const lines = text.split('\n');
    const header = lines[0].split(',');
    const col = (name: string) => {
        const i = header.indexOf(name);
        if (i < 0) throw new Error(`IBTrACS sem a coluna ${name}`);
        return i;
    };
    const [sid, time, sshs, track] = [col('SID'), col('ISO_TIME'), col('USA_SSHS'), col('TRACK_TYPE')];
    const storms: Record<string, string> = {};
    let firstDate: string | null = null;
    for (let i = 2; i < lines.length; i++) { // linha 1 = unidades
        const c = lines[i].split(',');
        if (c.length <= sshs) continue;
        const date = c[time].slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        if (firstDate === null || date < firstDate) firstDate = date;
        if (c[track].endsWith('spur') || storms[c[sid]] || !(parseInt(c[sshs], 10) >= 3)) continue;
        storms[c[sid]] = date;
    }
    return { storms, firstDate };
}

/** Junta a parte recente (que a NOAA revisa) ao catálogo: tudo a partir de `from` vem do arquivo novo. */
export function mergeRecent(catalog: Record<string, string>, recent: Record<string, string>, from: string): Record<string, string> {
    const kept = Object.fromEntries(Object.entries(catalog).filter(([, d]) => d < from));
    return { ...kept, ...recent };
}

/** Quantos ciclones fortes começaram em [from, to) (datas ISO). */
export function countBetween(dates: string[], from: string, to: string): number {
    return dates.filter(d => d >= from && d < to).length;
}
