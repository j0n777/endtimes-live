// Mt 24:14 — "este evangelho do Reino será pregado em todo o mundo" (09/10/2026).
// Fração da população mundial em povos ainda não alcançados, pela tabela pública do
// Joshua Project (AllPeoplesInCountry). Os termos do Joshua Project pedem o crédito
// "Data provided by Joshua Project" com link e vetam uso comercial: este sinal fica só
// no site gratuito, fora dos alertas pagos. Não há série histórica publicada, então o
// sinal aparece como progresso, fora do Ω, até termos histórico próprio.
import { parseCsvLine } from './stats';

export function unreachedShare(csv: string): { percent: number; groups: number } {
    const lines = csv.replace(/^﻿/, '').split(/\r?\n/);
    const headerAt = lines.findIndex(l => l.includes('LeastReached') && l.includes('Population'));
    if (headerAt < 0) throw new Error('cabeçalho do Joshua Project não encontrado');
    const header = parseCsvLine(lines[headerAt]);
    const pop = header.indexOf('Population');
    const reached = header.indexOf('LeastReached');
    let total = 0, unreached = 0, groups = 0;
    for (const line of lines.slice(headerAt + 1)) {
        if (!line.trim()) continue;
        const c = parseCsvLine(line);
        const n = parseFloat(c[pop]);
        if (!Number.isFinite(n)) continue;
        total += n;
        if (c[reached] === 'Y') { unreached += n; groups++; }
    }
    if (!total) throw new Error('tabela do Joshua Project sem população');
    return { percent: Math.round((unreached / total) * 1000) / 10, groups };
}
