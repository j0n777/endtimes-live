// Testes das funções puras do índice Ω (lib/signs/stats.ts).
// Rodar: npx tsx tests/test-signs-stats.ts
import {
    computeOmega, parseCsvLine, percentileRank,
    rollingWindowCounts, tensionLevel, trailingMeans, trendOf,
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

// tensionLevel (percentil da média de 7 dias do GPR de ameaças)
check('tensão: p30', tensionLevel(30), 1);
check('tensão: p50', tensionLevel(50), 2);
check('tensão: p80', tensionLevel(80), 3);
check('tensão: p90', tensionLevel(90), 4);
check('tensão: p97', tensionLevel(97), 5);
check('tensão: sem dado', tensionLevel(null), null);

// trailingMeans
check('médias móveis de 3', trailingMeans([1, 2, 3, 4, 5], 3), [2, 3, 4]);
check('médias móveis: série menor que a janela', trailingMeans([1, 2], 3), []);

// parseCsvLine
check('csv: aspas com vírgula', parseCsvLine('"Korea, North",PRK,2025,10'), ['Korea, North', 'PRK', '2025', '10']);
check('csv: aspas escapadas', parseCsvLine('"a ""b""",c'), ['a "b"', 'c']);

console.log(failures ? `\n❌ ${failures} falha(s)` : '\n✅ todos os testes passaram');
process.exit(failures ? 1 : 0);
