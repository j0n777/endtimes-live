// Testes das funções puras do alerta de apocalipse (lib/ews).
// Rodar: npx tsx tests/test-ews.ts
import { appendSample, assessCohort, hourOfWeek, levelFromZ } from '../lib/ews/stats';
import { countAirborne } from '../lib/ews/engine';
import type { EwsSample } from '../lib/ews/types';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) failures++;
    console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n     esperado ${JSON.stringify(expected)}\n     obtido   ${JSON.stringify(actual)}`}`);
}

const TZ = 'America/New_York';
const WEEK = 7 * 86_400_000;

// hourOfWeek: domingo 0h = 0
check('hora da semana: qua 13h EDT', hourOfWeek(new Date('2026-10-07T17:00:00Z'), TZ), 3 * 24 + 13);
check('hora da semana: dom 0h EDT', hourOfWeek(new Date('2026-10-04T04:00:00Z'), TZ), 0);
check('hora da semana: sáb 23h EST (inverno)', hourOfWeek(new Date('2026-12-06T04:30:00Z'), TZ), 6 * 24 + 23);

// levelFromZ
check('nível: z 0,5 → 1', levelFromZ(0.5), 1);
check('nível: z 1 → 2', levelFromZ(1), 2);
check('nível: z 2,5 → 3', levelFromZ(2.5), 3);
check('nível: z 3,9 → 4', levelFromZ(3.9), 4);
check('nível: z 4 → 5', levelFromZ(4), 5);
check('nível: queda não alarma', levelFromZ(-3), 1);

// assessCohort
const now = new Date('2026-10-07T17:10:00Z');
const at = (ms: number, jets: number | null, military: number | null = null): EwsSample =>
    ({ t: new Date(ms).toISOString(), jets, military });
const history: EwsSample[] = [
    at(now.getTime() - 1 * WEEK, 700),
    at(now.getTime() - 2 * WEEK, 720),
    at(now.getTime() - 3 * WEEK + 20 * 60_000, 740), // mesma hora da semana, 20 min depois
    at(now.getTime() - 2 * 86_400_000, 5000),       // semana corrente: fora da linha de base
    at(now.getTime() - 1 * WEEK + 3 * 3_600_000, 9000), // outra hora da semana: fora
];
// média 720, desvio 16,3 → piso √720 = 26,8 → z = (830−720)/26,8 = 4,1
check('avaliação: pico de 830 contra 720 → nível 5',
    assessCohort('jets', 830, history, now, TZ, 3),
    { id: 'jets', airborne: 830, expected: 720, z: 4.1, level: 5, weeks: 3 });
check('avaliação: normal',
    assessCohort('jets', 730, history, now, TZ, 3).level, 1);
check('avaliação: menos semanas que o mínimo → calibrando',
    assessCohort('jets', 830, history.slice(0, 2), now, TZ, 3),
    { id: 'jets', airborne: 830, expected: 710, z: null, level: null, weeks: 2 });
check('avaliação: fonte falhou nesta rodada',
    assessCohort('jets', null, history, now, TZ, 3).level, null);
check('avaliação: sem histórico do grupo',
    assessCohort('military', 300, history, now, TZ, 3),
    { id: 'military', airborne: 300, expected: null, z: null, level: null, weeks: 0 });

// countAirborne
check('no ar: ignora solo, sinal velho e militar quando pedido', countAirborne([
    { alt_baro: 41000, seen: 1 },
    { alt_baro: 'ground', seen: 1 },
    { alt_baro: 35000, seen: 120 },
    { alt_baro: 30000, seen: 2, dbFlags: 1 },
    { seen: 2 },
], { excludeMilitary: true }), 1);
check('no ar: militar conta no grupo militar', countAirborne([{ alt_baro: 30000, seen: 2, dbFlags: 1 }]), 1);

// appendSample
const old = at(now.getTime() - 71 * 86_400_000, 1);
const kept = at(now.getTime() - 69 * 86_400_000, 2);
const fresh = at(now.getTime(), 3);
check('histórico: descarta > 70 dias e ordena',
    appendSample([fresh, old, kept], at(now.getTime(), 4), 70).map(s => s.jets), [2, 4]);

console.log(failures ? `\n❌ ${failures} falha(s)` : '\n✅ todos os testes passaram');
process.exit(failures ? 1 : 0);
