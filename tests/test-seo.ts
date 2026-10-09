// Testes das páginas estáticas de SEO (lib/seo/pages.ts).
// Rodar: npx tsx tests/test-seo.ts
import { seoFiles } from '../lib/seo/pages';
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

if (failures) { console.log(`\n${failures} falha(s)`); process.exit(1); }
console.log('\nTudo certo.');
