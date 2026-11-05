// Testes das páginas estáticas de SEO (lib/seo/pages.ts).
// Rodar: npx tsx tests/test-seo.ts
import { seoFiles, HISTORY_CSV } from '../lib/seo/pages';
import { clipDescription, withBrand, TITLE_MAX, DESCRIPTION_MAX } from '../lib/seo/limits';
import type { SignsHistoryEntry } from '../lib/signs/types';
import { signInfoPath } from '../lib/seo/slugs';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) failures++;
    console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n     esperado ${JSON.stringify(expected)}\n     obtido   ${JSON.stringify(actual)}`}`);
}

const files = seoFiles(new Date('2026-10-09T12:00:00Z'));
const pages = Object.keys(files).filter(f => f.endsWith('index.html'));
const pathOf = (f: string) => `/${f.replace(/index\.html$/, '')}`;

check('22 páginas (hub + 9 sinais + sobre, em 2 idiomas)', pages.length, 22);
check('sitemap: home + 22 páginas', (files['sitemap.xml'].match(/<url>/g) || []).length, 23);
check('sitemap com lastmod do build', files['sitemap.xml'].includes('<lastmod>2026-10-09</lastmod>'), true);
check('link do painel aponta para página gerada', [signInfoPath('pt', 'sea'), signInfoPath('en', 'distress')].every(p => pages.includes(`${p.slice(1)}index.html`)), true);

let ldOk = true, hreflangOk = true, canonicalOk = true;
for (const f of pages) {
    const html = files[f];
    for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
        try { JSON.parse(m[1]); } catch { ldOk = false; }
    }
    if (!html.includes(`<link rel="canonical" href="https://endtimes.live${pathOf(f)}">`)) canonicalOk = false;
    // hreflang recíproco: a página do outro idioma aponta de volta para esta.
    const alt = [...html.matchAll(/hreflang="(pt-BR|en)" href="https:\/\/endtimes\.live([^"]+)"/g)].map(m => m[2]).find(p => p !== pathOf(f));
    const back = alt && files[`${alt.slice(1)}index.html`];
    if (!back || !back.includes(`href="https://endtimes.live${pathOf(f)}"`)) hreflangOk = false;
}
check('JSON-LD válido em todas', ldOk, true);
check('canonical próprio em todas', canonicalOk, true);
check('hreflang recíproco em todas', hreflangOk, true);
check('texto com "<" escapado', files['sobre/index.html'].includes('<script>alert'), false);
check('llms.txt lista as páginas', files['llms.txt'].includes('https://endtimes.live/en/signs/roaring-sea/'), true);

// Limites de título e descrição (05/11/2026)
check('withBrand: acrescenta a marca quando cabe', withBrand('Sobre'), 'Sobre | End Times Monitor');
check('withBrand: omite a marca quando não cabe', withBrand('x'.repeat(50)), 'x'.repeat(50));
check('clipDescription: curto fica igual', clipDescription('Texto curto.'), 'Texto curto.');
const clipped = clipDescription('palavra '.repeat(40));
check('clipDescription: corta em palavra, com reticências', [clipped.length <= DESCRIPTION_MAX, clipped.endsWith('palavra…')], [true, true]);

const history: SignsHistoryEntry[] = [
    { date: '2026-10-06', omega: 3, tension: 2, percentiles: { earthquakes: 91, wars: 94.4, persecution: null } },
    { date: '2026-10-07', omega: 4, tension: 3, percentiles: { earthquakes: 80, wars: 95, persecution: null } },
];
const withHist = seoFiles(new Date('2026-10-09T12:00:00Z'), history);
const allPagesH = Object.keys(withHist).filter(f => f.endsWith('index.html'));
check('com histórico: 24 páginas', allPagesH.length, 24);
check('com histórico: páginas pt e en', ['sinais/historico/index.html', 'en/signs/history/index.html'].every(f => allPagesH.includes(f)), true);
check('CSV: cabeçalho e linhas', withHist[HISTORY_CSV].split('\n').slice(0, 2), ['date,omega,earthquakes,wars,famine,pestilence,heavens,sea,persecution,distress,gospel', '2026-10-06,3,91,94.4,,,,,,,']);
check('sitemap: histórico com lastmod da última leitura', withHist['sitemap.xml'].includes('<loc>https://endtimes.live/sinais/historico/</loc><lastmod>2026-10-07</lastmod>'), true);
check('hub linka o histórico só quando ele existe', [withHist['sinais/index.html'].includes('/sinais/historico/'), files['sinais/index.html'].includes('/sinais/historico/')], [true, false]);
check('histórico: terremotos 1 dia acima do percentil 90', withHist['sinais/historico/index.html'].includes('Terremotos</a>: 1 dia<'), true);

let titleOk = true, descOk = true;
for (const f of allPagesH) {
    const t = withHist[f].match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    const d = withHist[f].match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
    const unesc = (x: string) => x.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (!t || unesc(t).length > TITLE_MAX) { titleOk = false; console.log('   título longo:', f, unesc(t).length); }
    if (!d || unesc(d).length > DESCRIPTION_MAX) { descOk = false; console.log('   descrição longa:', f, unesc(d).length); }
}
check(`títulos até ${TITLE_MAX} caracteres`, titleOk, true);
check(`descrições até ${DESCRIPTION_MAX} caracteres`, descOk, true);

if (failures) { console.log(`\n${failures} falha(s)`); process.exit(1); }
console.log('\nTudo certo.');
