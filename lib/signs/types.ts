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
    | 'distress';

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
}

export interface TensionMarket {
    question: string;
    probability: number;           // 0–1
    monthChange: number | null;    // variação em 30 dias, em pontos de probabilidade
    volume: number;
    url: string;
}

export type IndexLevel = 1 | 2 | 3 | 4 | 5;

export interface SignsPayload {
    version: 1;
    generatedAt: string;
    omega: {
        level: IndexLevel | null;  // null = sinais utilizáveis insuficientes
        anomalous: SignId[];       // sinais no percentil ≥ 90
        usable: number;
        rising: number;
    };
    tension: {
        level: IndexLevel | null;  // 1 = baixa … 5 = crítica
        maxProbability: number | null;
        markets: TensionMarket[];
    };
    signs: SignReading[];
}

export interface SignsHistoryEntry {
    date: string;                  // YYYY-MM-DD (UTC)
    omega: IndexLevel | null;
    tension: IndexLevel | null;
    percentiles: Partial<Record<SignId, number | null>>;
}
