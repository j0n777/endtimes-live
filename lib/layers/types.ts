// Tipos das camadas de dados do mapa (07/10/2026). Compartilhado entre o worker,
// que publica os JSONs no Storage, e o SituationMap, que só lê.

export interface ChokepointReading {
    id: string;              // portid do PortWatch, ex.: 'chokepoint6'
    name: string;            // 'Strait of Hormuz'
    lat: number;
    lon: number;
    recentAvg: number;       // travessias/dia nos últimos `windowDays` dias com dado
    baselineAvg: number;     // travessias/dia no histórico
    changePct: number;       // (recentAvg / baselineAvg − 1) × 100
    lastDate: string;        // último dia com dado (o PortWatch atrasa ~2 dias)
}

export interface ChokepointsPayload {
    version: 1;
    generatedAt: string;
    windowDays: number;
    baselineSpan: string;    // '2019–2025'
    source: string;
    sourceUrl: string;
    chokepoints: ChokepointReading[];
}
