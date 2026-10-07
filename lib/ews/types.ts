// Alerta de apocalipse (07/10/2026): modelo do Apocalypse Early Warning System de Kyle
// McDonald (ews.kylemcdonald.net) refeito com dados próprios do adsb.lol (ODbL).
// Ideia dele: se uma catástrofe for iminente, quem tem jato particular decola primeiro;
// então conta-se quantos jatos executivos estão no ar e compara-se com o esperado
// para aquela hora da semana.

export type EwsCohortId = 'jets' | 'military';

/** Uma amostra do worker: aeronaves de cada grupo no ar naquele instante. */
export interface EwsSample {
    t: string;                     // ISO
    jets: number | null;
    military: number | null;
}

export interface EwsCohortReading {
    id: EwsCohortId;
    airborne: number | null;       // no ar agora (null = fonte falhou nesta rodada)
    expected: number | null;       // média das semanas anteriores na mesma hora da semana
    z: number | null;              // desvios acima do esperado
    level: 1 | 2 | 3 | 4 | 5 | null; // null enquanto o histórico não tem semanas suficientes
    weeks: number;                 // semanas distintas de histórico nesta hora da semana
}

export interface EwsPayload {
    version: 1;
    generatedAt: string;
    timeZone: string;
    minWeeks: number;
    source: string;
    sourceUrl: string;
    cohorts: EwsCohortReading[];
}
