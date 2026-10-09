// Tipos do índice Ω e da Tensão Militar (06/10/2026).
// Compartilhado entre o worker (lib/signs/engine.ts, roda no GitHub Actions) e o
// front (App.tsx / StatusBar / SignsPanel), que só lê o signs.json publicado.

export type SignId =
    | 'earthquakes'
    | 'wars'
    | 'famine'
    | 'pestilence'
    | 'heavens'
    | 'sea'
    | 'persecution'
    | 'distress'
    | 'gospel';

export type SignTrend = 'up' | 'down' | 'flat';

// ok             → entra no cálculo do Ω
// short-baseline → mostrado, mas fora do Ω (histórico curto demais para percentil confiável)
// unavailable    → ainda sem fonte primária com histórico
// error          → a fonte falhou nesta rodada
export type SignStatus = 'ok' | 'short-baseline' | 'unavailable' | 'error';

export interface SignReading {
    id: SignId;
    status: SignStatus;
    value: number | null;          // métrica atual
    baselineMean: number | null;   // média histórica da mesma métrica
    percentile: number | null;     // 0–100, posição do valor atual no histórico
    trend: SignTrend | null;       // período atual vs. período anterior
    period: string | null;         // o que "atual" significa: '2026-09', '2025', data da última leitura…
    baselineSpan: string | null;   // de onde vem o histórico: '2000–2025'
    sourceName: string;
    sourceUrl: string;
    error?: string;
    extra?: Record<string, number>; // números extras para o texto do sinal
}

export type IndexLevel = 1 | 2 | 3 | 4 | 5;

// Contexto planetário mostrado no painel, fora do cálculo do Ω.
export interface Co2Reading {
    ppm: number;                   // média diária em Mauna Loa (NOAA GML)
    date: string;                  // YYYY-MM-DD
    yearAgoPpm: number | null;     // leitura mais próxima de 365 dias antes
}

export interface SignsPayload {
    version: 1;
    generatedAt: string;
    context?: { co2: Co2Reading | null };
    omega: {
        level: IndexLevel | null;  // null = sinais utilizáveis insuficientes
        anomalous: SignId[];       // sinais no percentil ≥ 90
        usable: number;
        rising: number;
    };
    tension: {
        level: IndexLevel | null;  // 1 = baixa … 5 = crítica
        value: number | null;      // GPR de ameaças, média dos últimos 7 dias
        percentile: number | null; // vs. todas as médias de 7 dias desde 1985
        date: string | null;       // último dia com dado (YYYY-MM-DD)
        sourceUrl: string;
    };
    signs: SignReading[];
}

export interface SignsHistoryEntry {
    date: string;                  // YYYY-MM-DD (UTC)
    omega: IndexLevel | null;
    tension: IndexLevel | null;
    percentiles: Partial<Record<SignId, number | null>>;
}
