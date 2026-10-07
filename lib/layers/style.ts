// Regras visuais puras das camadas do mapa. Testadas em tests/test-layers.ts.

// Abaixo disso a variação percentual vira ruído (Estreito de Bering, ~1 navio/dia).
export const CHOKEPOINT_MIN_BASELINE = 5;

export type ChokepointLevel = 'collapse' | 'disrupted' | 'normal' | 'surge' | 'low-traffic';

export function chokepointLevel(changePct: number, baselineAvg: number): ChokepointLevel {
    if (baselineAvg < CHOKEPOINT_MIN_BASELINE) return 'low-traffic';
    if (changePct <= -50) return 'collapse';
    if (changePct <= -25) return 'disrupted';
    if (changePct >= 25) return 'surge';
    return 'normal';
}

export const CHOKEPOINT_COLOR: Record<ChokepointLevel, string> = {
    collapse: '#ef4444',
    disrupted: '#f97316',
    normal: '#34d399',
    surge: '#38bdf8',
    'low-traffic': '#6b7280',
};

/** Raio cresce com a magnitude (M4,5 → 5px, M6 → 11px, M8 → 19px); cor esfria com a idade. */
export function quakeStyle(magnitude: number, ageHours: number) {
    const radius = Math.max(4, Math.round((magnitude - 3.25) * 4));
    const color = ageHours < 24 ? '#ef4444' : ageHours < 72 ? '#f97316' : '#eab308';
    return { radius, color };
}

/** Escapa texto de fontes externas antes de ir para o HTML do popup. */
export function escapeHtml(s: unknown): string {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
