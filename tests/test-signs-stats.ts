// Testes das funções puras do índice Ω (lib/signs/stats.ts).
// Rodar: npx tsx tests/test-signs-stats.ts
import {
    computeOmega, parseCsvLine, percentileRank, pickEscalationMarkets,
    rollingWindowCounts, tensionLevel, trendOf,
} from '../lib/signs/stats';
import type { SignReading } from '../lib/signs/types';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) failures++;
    console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n     esperado ${JSON.stringify(expected)}\n     obtido   ${JSON.stringify(actual)}`}`);
}

// percentileRank
check('percentil: abaixo de tudo', percentileRank(0, [1, 2, 3, 4]), 0);
check('percentil: acima de tudo', percentileRank(9, [1, 2, 3, 4]), 100);
check('percentil: empate conta meio', percentileRank(2, [1, 2, 3, 4]), 37.5);
check('percentil: amostra vazia', percentileRank(5, []), null);

// trendOf
check('tendência: +20% sobe', trendOf(12, 10), 'up');
check('tendência: -20% desce', trendOf(8, 10), 'down');
check('tendência: +5% estável', trendOf(10.5, 10), 'flat');
check('tendência: de zero para algo sobe', trendOf(3, 0), 'up');
check('tendência: zero e zero estável', trendOf(0, 0), 'flat');

// rollingWindowCounts: eventos nos dias 0,1,1,5 — janelas de 3 dias terminando em 2..6
check('janela móvel', rollingWindowCounts([0, 1, 1, 5], 0, 6, 3), [3, 2, 0, 1, 1]);
check('janela maior que o período', rollingWindowCounts([0], 0, 1, 3), []);
check('eventos fora do intervalo ignorados', rollingWindowCounts([-5, 0, 99], 0, 2, 3), [1]);

// computeOmega
const sign = (id: string, percentile: number | null, trend: 'up' | 'down' | 'flat' = 'flat', status = 'ok') =>
    ({ id, status, percentile, trend } as unknown as SignReading);
const calm = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(id => sign(id, 50));
check('Ω: tudo normal → WATCHMAN', computeOmega(calm).level, 1);
check('Ω: 1 anômalo → SIGNS', computeOmega([sign('x', 95), ...calm.slice(1)]).level, 2);
check('Ω: 2 anômalos → BIRTH PANGS', computeOmega([sign('x', 95), sign('y', 91), ...calm.slice(2)]).level, 3);
check('Ω: 3 anômalos → TRIBULATION', computeOmega([sign('x', 95), sign('y', 91), sign('z', 99), ...calm.slice(3)]).level, 4);
const allHot = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(id => sign(id, 97, 'up'));
check('Ω: ≥70% anômalos e maioria subindo → MARANATHA', computeOmega(allHot).level, 5);
const hotButFalling = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(id => sign(id, 97, 'down'));
check('Ω: ≥70% anômalos mas caindo → TRIBULATION', computeOmega(hotButFalling).level, 4);
check('Ω: sinais em erro não entram', computeOmega([sign('x', 99, 'up', 'error'), ...calm.slice(1)]).anomalous, []);
check('Ω: short-baseline não entra', computeOmega([sign('x', 99, 'up', 'short-baseline'), ...calm.slice(1)]).usable, 6);
check('Ω: menos de 5 sinais utilizáveis → sem nível', computeOmega(calm.slice(0, 4)).level, null);

// tensionLevel
check('tensão: 2%', tensionLevel(0.02), 1);
check('tensão: 5%', tensionLevel(0.05), 2);
check('tensão: 21,5%', tensionLevel(0.215), 3);
check('tensão: 30%', tensionLevel(0.3), 4);
check('tensão: 60%', tensionLevel(0.6), 5);
check('tensão: sem mercados', tensionLevel(null), null);

// pickEscalationMarkets
const now = new Date('2026-10-06T00:00:00Z');
const mk = (question: string, yes: string, extra: Record<string, unknown> = {}) => ({
    question, active: true, closed: false, volume: '1000000', endDate: '2027-01-01T00:00:00Z',
    outcomes: '["Yes","No"]', outcomePrices: JSON.stringify([yes, String(1 - Number(yes))]), oneMonthPriceChange: -0.02, ...extra,
});
const events = [{ slug: 'ev', markets: [
    mk('Will the U.S. invade Iran before 2027?', '0.155'),
    mk('NATO x Russia military clash by December 31, 2026?', '0.215'),
    mk('Netanyahu out by March 31?', '0.9'),                                   // não é escalada
    mk('Will China invade Taiwan by end of 2026?', '0.5', { volume: '1000' }),  // volume baixo
    mk('US strike on Cuba by December 31?', '0.4', { closed: true }),           // fechado
    mk('Will Russia invade Finland?', '0.3', { endDate: '2026-01-01T00:00:00Z' }), // vencido
]}];
check('mercados: filtra e ordena por probabilidade',
    pickEscalationMarkets(events, now).map(m => [m.question.slice(0, 12), m.probability]),
    [['NATO x Russi', 0.215], ['Will the U.S', 0.155]]);

// parseCsvLine
check('csv: aspas com vírgula', parseCsvLine('"Korea, North",PRK,2025,10'), ['Korea, North', 'PRK', '2025', '10']);
check('csv: aspas escapadas', parseCsvLine('"a ""b""",c'), ['a "b"', 'c']);

console.log(failures ? `\n❌ ${failures} falha(s)` : '\n✅ todos os testes passaram');
process.exit(failures ? 1 : 0);
