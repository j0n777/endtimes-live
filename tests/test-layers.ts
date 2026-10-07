// Testes das funções puras das camadas do mapa (lib/layers).
// Rodar: npx tsx tests/test-layers.ts
import { summarizeChokepoints } from '../lib/layers/chokepoints';
import { chokepointLevel, escapeHtml, quakeStyle, safeUrl } from '../lib/layers/style';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) failures++;
    console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n     esperado ${JSON.stringify(expected)}\n     obtido   ${JSON.stringify(actual)}`}`);
}

// chokepointLevel
check('gargalo: −97% → colapso', chokepointLevel(-97, 83.7), 'collapse');
check('gargalo: −30% → perturbado', chokepointLevel(-30, 60), 'disrupted');
check('gargalo: −10% → normal', chokepointLevel(-10, 60), 'normal');
check('gargalo: +40% → pico', chokepointLevel(40, 60), 'surge');
check('gargalo: tráfego baixo ignora variação', chokepointLevel(-90, 1.2), 'low-traffic');

// summarizeChokepoints: usa só os N dias mais recentes e ordena do pior para o melhor
const locs = [
    { portid: 'h', portname: 'Hormuz', lat: 26.5, lon: 56.3 },
    { portid: 'm', portname: 'Malacca', lat: 2.5, lon: 101.5 },
    { portid: 'x', portname: 'Sem histórico', lat: 0, lon: 0 },
];
const base = [{ portid: 'h', avg_total: 80 }, { portid: 'm', avg_total: 200 }];
const rows = [
    { portid: 'h', date: '2026-10-04', n_total: 4 },
    { portid: 'h', date: '2026-10-03', n_total: 2 },
    { portid: 'h', date: '2026-09-01', n_total: 999 },   // fora da janela de 2 dias
    { portid: 'm', date: '2026-10-04', n_total: 220 },
    { portid: 'm', date: '2026-10-03', n_total: 200 },
];
const out = summarizeChokepoints(locs, base, rows, 2);
check('gargalos: janela recente', out.map(c => [c.name, c.recentAvg, c.changePct, c.lastDate]),
    [['Hormuz', 3, -96.2, '2026-10-04'], ['Malacca', 210, 5, '2026-10-04']]);
check('gargalos: sem histórico fica fora', out.some(c => c.id === 'x'), false);

// quakeStyle
check('sismo: M4,5 recente', quakeStyle(4.5, 2), { radius: 5, color: '#ef4444' });
check('sismo: M6 de 2 dias', quakeStyle(6, 48), { radius: 11, color: '#f97316' });
check('sismo: M8 antigo', quakeStyle(8, 120), { radius: 19, color: '#eab308' });
check('sismo: raio mínimo', quakeStyle(2.5, 1).radius, 4);

// escapeHtml
check('escape: tags e aspas', escapeHtml(`<img src=x onerror="a('b')">`), '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;');
check('escape: nulo', escapeHtml(null), '');
check('safeUrl: https', safeUrl('https://t.me/x?a=1&b="2"'), 'https://t.me/x?a=1&amp;b=%222%22');
check('safeUrl: javascript', safeUrl('javascript:alert(1)'), '');
check('safeUrl: data', safeUrl('data:text/html,<script>'), '');
check('safeUrl: relativa/lixo', safeUrl('/foo'), '');

console.log(failures ? `\n❌ ${failures} falha(s)` : '\n✅ todos os testes passaram');
process.exit(failures ? 1 : 0);
