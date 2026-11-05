// Testes da linha dia/noite do mapa (utils/sunTerminator.ts).
// Rodar: npx tsx tests/test-sun.ts  (o resultado não pode depender do fuso: rode com TZ diferentes)
import { getTerminatorLatLngs, subsolarPoint } from '../utils/sunTerminator';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) failures++;
    console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n     esperado ${JSON.stringify(expected)}\n     obtido   ${JSON.stringify(actual)}`}`);
}

function isNight(date: string, lat: number, lng: number): boolean {
    const poly = getTerminatorLatLngs(new Date(date));
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [yi, xi] = poly[i], [yj, xj] = poly[j];
        if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

const BRASILIA = [-15.8, -47.9] as const;
const TOKYO = [35.7, 139.7] as const;
const LONDON = [51.5, -0.1] as const;

// Novembro: sol no hemisfério sul.
check('05/11 13h UTC: Brasília (10h) é dia', isNight('2026-11-05T13:00:00Z', ...BRASILIA), false);
check('05/11 13h UTC: Tóquio (22h) é noite', isNight('2026-11-05T13:00:00Z', ...TOKYO), true);
check('05/11 03h UTC: Brasília (0h) é noite', isNight('2026-11-05T03:00:00Z', ...BRASILIA), true);
check('05/11 03h UTC: Tóquio (12h) é dia', isNight('2026-11-05T03:00:00Z', ...TOKYO), false);
// Junho: sol no hemisfério norte (o lado escuro fecha pelo polo sul).
check('21/06 12h UTC: Londres (13h) é dia', isNight('2026-06-21T12:00:00Z', ...LONDON), false);
check('21/06 00h UTC: Brasília (21h) é noite', isNight('2026-06-21T00:00:00Z', ...BRASILIA), true);
check('21/06 12h UTC: polo sul na noite polar', isNight('2026-06-21T12:00:00Z', -85, 0), true);

// Ponto subsolar: ao meio-dia UTC fica perto de Greenwich (equação do tempo < 17 min = 4,25°).
const noon = subsolarPoint(new Date('2026-11-05T12:00:00Z'));
check('subsolar 05/11 12h UTC perto de 0° de longitude', Math.abs(noon.lng) < 5, true);
check('declinação em 05/11 ≈ −15,6°', Math.abs(noon.lat + 15.6) < 0.5, true);
const solstice = subsolarPoint(new Date('2026-06-21T12:00:00Z'));
check('declinação no solstício de junho ≈ +23,4°', Math.abs(solstice.lat - 23.44) < 0.2, true);

if (failures) { console.log(`\n${failures} falha(s)`); process.exit(1); }
console.log('\nTudo certo.');
