// IndexNow (05/11/2026): avisa Bing, Yandex, Naver, Seznam e Yep que as páginas do
// sitemap mudaram. O Google não participa (para ele vale o Search Console).
// Rodar depois de cada deploy na Lovable:
//   npm run indexnow                      (todas as URLs do sitemap)
//   npm run indexnow -- --since=2026-11-05 (só as com lastmod a partir da data)
//   npm run indexnow -- --dry-run          (só lista)
// A chave é pública por definição: fica em public/<KEY>.txt e é servida na raiz do site.
// Protocolo: https://www.indexnow.org/documentation
const HOST = 'endtimes.live';
const KEY = '4bd79e7199cb7951bfafdb37fec484a6';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const since = arg('since');
const dryRun = process.argv.includes('--dry-run');
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const fail = (msg) => { console.error(`indexnow: ${msg}`); process.exit(1); };

const keyRes = await fetch(KEY_LOCATION);
if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) fail(`${KEY_LOCATION} não serve a chave (HTTP ${keyRes.status}). Publique o site antes.`);

const smRes = await fetch(`https://${HOST}/sitemap.xml`);
if (!smRes.ok) fail(`sitemap.xml respondeu HTTP ${smRes.status}`);
const xml = await smRes.text();
const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  .map(([, b]) => ({ loc: b.match(/<loc>([^<]+)<\/loc>/)?.[1], lastmod: b.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? '' }))
  .filter((u) => u.loc && (!since || u.lastmod >= since))
  .map((u) => u.loc);
if (!urls.length) fail('nenhuma URL para enviar');
console.log(`indexnow: ${urls.length} URL(s)`);
if (dryRun) { console.log(urls.join('\n')); process.exit(0); }

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
});
// 200/202 = aceito; 403 = chave não publicada; 422 = URL de outro host; 429 = envios demais.
if (res.status !== 200 && res.status !== 202) fail(`HTTP ${res.status} ${(await res.text()).trim()}`);
console.log(`indexnow: HTTP ${res.status}, enviado`);
