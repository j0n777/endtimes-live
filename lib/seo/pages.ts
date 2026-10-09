// Páginas estáticas para buscadores e IAs (09/10/2026). O app é um SPA: sem JavaScript,
// robôs de busca e de IA só viam o <noscript>. Estas páginas saem em HTML puro no build
// (plugin em vite.config.ts), com dados estruturados, hreflang e links para o app.
// Os números ao vivo ficam no app; aqui vai o texto que não envelhece: versículo, o que
// é medido, fonte e método.

import { en } from '../../locales/en';
import { ptBR } from '../../locales/pt-BR';
import { CREDITS } from '../credits';
import type { SignId } from '../signs/types';
import { ANOMALY_PERCENTILE, MIN_USABLE_SIGNS } from '../signs/stats';
import { SIGN_ORDER, SLUGS, type Lang } from './slugs';

export const SITE = 'https://endtimes.live';
const SITE_NAME = 'End Times Monitor';
const OG_IMAGE = `${SITE}/og-banner.jpg`;

const SOURCES: Record<SignId, [string, string]> = {
    earthquakes: ['USGS Earthquake Hazards Program', 'https://earthquake.usgs.gov/earthquakes/map/'],
    wars: ['UCDP / Our World in Data', 'https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type'],
    famine: ['World Bank Commodity Price Data (Pink Sheet)', 'https://www.worldbank.org/en/research/commodity-markets'],
    pestilence: ['WHO Disease Outbreak News', 'https://www.who.int/emergencies/disease-outbreak-news'],
    heavens: ['GFZ Potsdam — Kp index', 'https://kp.gfz-potsdam.de/en/'],
    sea: ['NOAA IBTrACS', 'https://www.ncei.noaa.gov/products/international-best-track-archive'],
    persecution: ['Open Doors — World Watch List', 'https://www.portasabertas.org.br/lista-mundial'],
    distress: ['Office of Financial Research — Financial Stress Index', 'https://www.financialresearch.gov/financial-stress-index/'],
    gospel: ['Data provided by Joshua Project', 'https://joshuaproject.net/'],
};

const MEASURE: Record<Lang, Record<SignId, string>> = {
    pt: {
        earthquakes: 'Contamos os terremotos de magnitude 6 ou maior registrados no mundo nos últimos 30 dias, pelo catálogo do USGS (Serviço Geológico dos EUA), e comparamos com o histórico do próprio catálogo.',
        wars: 'Usamos o total de mortes em conflitos armados do UCDP (Uppsala Conflict Data Program), publicado pelo Our World in Data, e comparamos com a série histórica.',
        famine: 'Usamos o índice de preços de alimentos do Banco Mundial (Pink Sheet, base 2010 = 100), publicado todo mês, e comparamos com a própria série.',
        pestilence: 'Contamos os alertas de surto (Disease Outbreak News) publicados pela Organização Mundial da Saúde nos últimos 90 dias.',
        heavens: 'Contamos os dias com tempestade geomagnética (índice Kp 5 ou maior) nos últimos 30 dias, pelo índice Kp do GFZ Potsdam. Essas tempestades vêm de erupções e do vento solar.',
        sea: 'Contamos os ciclones tropicais que chegaram à categoria 3 ou mais nos últimos 90 dias, pela base IBTrACS da NOAA, e comparamos com a mesma época do ano desde 1981.',
        persecution: 'A Portas Abertas publica a Lista Mundial da Perseguição uma vez por ano, sem série que possa ser lida automaticamente. Por isso este sinal ainda não é medido aqui.',
        distress: 'Usamos o índice de estresse financeiro do OFR (Office of Financial Research, ligado ao Tesouro dos EUA), em que 0 é o nível normal, e comparamos com a série desde 2000.',
        gospel: 'Mostramos a fração da população mundial que vive em povos não alcançados, pela tabela pública do Joshua Project. Como não há série histórica publicada, este sinal aparece no painel mas fica fora do Ω.',
    },
    en: {
        earthquakes: 'We count magnitude 6+ earthquakes recorded worldwide in the last 30 days in the USGS catalog and compare the count with the catalog’s own history.',
        wars: 'We use total deaths in armed conflicts from the UCDP (Uppsala Conflict Data Program), published by Our World in Data, compared with the historical series.',
        famine: 'We use the World Bank food price index (Pink Sheet, 2010 = 100), published monthly, compared with its own history.',
        pestilence: 'We count the outbreak alerts (Disease Outbreak News) published by the World Health Organization in the last 90 days.',
        heavens: 'We count geomagnetic storm days (Kp index 5 or higher) in the last 30 days, from the GFZ Potsdam Kp index. These storms are driven by solar eruptions and the solar wind.',
        sea: 'We count tropical cyclones that reached category 3 or higher in the last 90 days, from NOAA’s IBTrACS dataset, compared with the same time of year since 1981.',
        persecution: 'Open Doors publishes the World Watch List once a year, with no machine-readable series, so this sign is not measured here yet.',
        distress: 'We use the OFR (Office of Financial Research, U.S. Treasury) Financial Stress Index, where 0 is normal, compared with the series since 2000.',
        gospel: 'We show the share of the world population living in unreached people groups, from Joshua Project’s public table. With no published historical series, this sign is shown on the dashboard but left out of Ω.',
    },
};

const COPY = {
    pt: {
        htmlLang: 'pt-BR', ogLocale: 'pt_BR', bible: 'Almeida', t: ptBR,
        hubPath: '/sinais/', aboutPath: '/sobre/', signPath: (s: string) => `/sinais/${s}/`,
        appUrl: '/?lang=pt',
        home: 'Início', open: 'Abrir o painel ao vivo', measured: 'O que medimos', source: 'Fonte', method: 'Método',
        allSigns: 'Todos os sinais', about: 'Sobre e fontes', otherLang: 'English',
        hubTitle: 'Sinais dos tempos: os 9 sinais de Mateus 24 e Lucas 21 acompanhados com dados',
        hubDesc: 'Terremotos, guerras, fome, pestes, sinais no sol, bramido do mar, angústia das nações e o evangelho pregado a todas as nações — cada sinal bíblico medido com dados públicos e comparado com o próprio histórico.',
        hubIntro: 'Jesus descreveu sinais que antecederiam a sua volta (Mateus 24, Marcos 13, Lucas 21). O End Times Monitor acompanha cada um com uma fonte pública de dados e mostra quando ele foge do próprio histórico. É um painel de vigilância, não uma previsão de datas.',
        omegaTitle: 'O índice Ω',
        omega: [
            `Cada sinal é comparado com o próprio histórico e recebe um percentil. Acima do percentil ${ANOMALY_PERCENTILE}, ele é considerado anômalo.`,
            `O Ω só é calculado com pelo menos ${MIN_USABLE_SIGNS} sinais com dados. Nível 1: nenhum anômalo. Nível 2: um. Nível 3: dois. Nível 4: três ou mais. Nível 5: quando 70% ou mais dos sinais estão anômalos e mais da metade está em alta.`,
            'É a ideia das dores de parto (Mateus 24:8): o que importa não é um evento isolado, mas vários sinais se intensificando ao mesmo tempo.',
        ],
        faq: [
            ['O que é o índice Ω?', `Um nível de 1 a 5 que sobe quando vários sinais ficam acima do percentil ${ANOMALY_PERCENTILE} do próprio histórico ao mesmo tempo.`],
            ['De onde vêm os dados?', 'De fontes públicas: USGS, UCDP/Our World in Data, Banco Mundial, OMS, GFZ Potsdam, NOAA, OFR e Joshua Project. A lista completa com licenças está na página Sobre.'],
            ['O painel prevê a data do fim?', 'Não. "Daquele dia e hora, porém, ninguém sabe, nem os anjos do céu, nem o Filho, senão só o Pai" (Mateus 24:36). O painel mostra a intensidade dos sinais, não datas.'],
        ] as [string, string][],
        aboutTitle: 'Sobre o End Times Monitor: método e fontes de dados',
        aboutDesc: 'Como o End Times Monitor mede os sinais dos tempos, de onde vêm os dados do mapa e das notícias, e as licenças de cada fonte.',
        aboutIntro: [
            'O End Times Monitor é um painel ao vivo que reúne, num mapa, eventos e indicadores ligados aos sinais descritos por Jesus em Mateus 24 e Lucas 21: terremotos, guerras, fome, pestes, sinais no céu e angústia das nações.',
            'Os sinais são calculados automaticamente a cada poucas horas a partir de dados públicos. As notícias do mapa vêm de feeds RSS de veículos de imprensa e de órgãos públicos; mostramos só título, um trecho curto e o link para a matéria original.',
            'O painel não faz previsão de datas. Ele mostra quando os indicadores fogem do próprio histórico, para quem quer vigiar (Marcos 13:37).',
        ],
        sourcesTitle: 'Fontes de dados e licenças',
        creator: 'Criado por',
    },
    en: {
        htmlLang: 'en', ogLocale: 'en_US', bible: 'KJV', t: en,
        hubPath: '/en/signs/', aboutPath: '/en/about/', signPath: (s: string) => `/en/signs/${s}/`,
        appUrl: '/?lang=en',
        home: 'Home', open: 'Open the live dashboard', measured: 'What we measure', source: 'Source', method: 'Method',
        allSigns: 'All signs', about: 'About & sources', otherLang: 'Português',
        hubTitle: 'Signs of the times: the 9 signs of Matthew 24 and Luke 21 tracked with data',
        hubDesc: 'Earthquakes, wars, famine, pestilences, signs in the sun, the roaring sea, distress of nations and the gospel preached to all nations — each biblical sign tracked with public data and compared with its own history.',
        hubIntro: 'Jesus described signs that would precede his return (Matthew 24, Mark 13, Luke 21). End Times Monitor tracks each one with a public data source and shows when it departs from its own history. It is a watch dashboard, not a date prediction.',
        omegaTitle: 'The Ω index',
        omega: [
            `Each sign is compared with its own history and gets a percentile. Above the ${ANOMALY_PERCENTILE}th percentile it counts as anomalous.`,
            `Ω is only computed with at least ${MIN_USABLE_SIGNS} signs with data. Level 1: none anomalous. Level 2: one. Level 3: two. Level 4: three or more. Level 5: when 70% or more of the signs are anomalous and more than half are rising.`,
            'It follows the idea of birth pains (Matthew 24:8): what matters is not one isolated event but several signs intensifying at the same time.',
        ],
        faq: [
            ['What is the Ω index?', `A level from 1 to 5 that rises when several signs are above the ${ANOMALY_PERCENTILE}th percentile of their own history at the same time.`],
            ['Where does the data come from?', 'From public sources: USGS, UCDP/Our World in Data, the World Bank, WHO, GFZ Potsdam, NOAA, OFR and Joshua Project. The full list with licenses is on the About page.'],
            ['Does the dashboard predict the date of the end?', 'No. "But of that day and hour knoweth no man, no, not the angels of heaven, but my Father only" (Matthew 24:36). The dashboard shows how intense the signs are, not dates.'],
        ] as [string, string][],
        aboutTitle: 'About End Times Monitor: method and data sources',
        aboutDesc: 'How End Times Monitor measures the signs of the times, where the map and news data come from, and the license of each source.',
        aboutIntro: [
            'End Times Monitor is a live dashboard that brings together, on one map, events and indicators tied to the signs Jesus described in Matthew 24 and Luke 21: earthquakes, wars, famine, pestilences, signs in the heavens and distress of nations.',
            'The signs are computed automatically every few hours from public data. Map news comes from RSS feeds of news outlets and public agencies; we show only the headline, a short excerpt and a link to the original story.',
            'The dashboard does not predict dates. It shows when the indicators depart from their own history, for those who want to keep watch (Mark 13:37).',
        ],
        sourcesTitle: 'Data sources and licenses',
        creator: 'Created by',
    },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// JSON-LD dentro de <script>: impede que um "</script>" no texto feche a tag.
const ld = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const ORGANIZATION = {
    '@type': 'Organization', '@id': `${SITE}/#org`, name: SITE_NAME, url: `${SITE}/`,
    logo: { '@type': 'ImageObject', url: `${SITE}/logo_etm.jpg` },
};
const WEBSITE = { '@type': 'WebSite', '@id': `${SITE}/#website`, name: SITE_NAME, url: `${SITE}/`, publisher: { '@id': `${SITE}/#org` }, inLanguage: ['en', 'pt-BR'] };

function breadcrumb(items: [string, string][]) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${path}` })),
    };
}

interface PageSpec {
    lang: Lang;
    path: string;
    altPath: string;     // mesma página no outro idioma
    title: string;
    description: string;
    graph: object[];
    crumbs: [string, string][];
    body: string;
}

function render(p: PageSpec): string {
    const c = COPY[p.lang];
    const enPath = p.lang === 'en' ? p.path : p.altPath;
    const ptPath = p.lang === 'pt' ? p.path : p.altPath;
    const crumbsHtml = p.crumbs.map(([name, path], i) =>
        i === p.crumbs.length - 1 ? `<span>${esc(name)}</span>` : `<a href="${path}">${esc(name)}</a>`).join(' › ');
    return `<!DOCTYPE html>
<html lang="${c.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)} | ${SITE_NAME}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${SITE}${p.path}">
<link rel="alternate" hreflang="pt-BR" href="${SITE}${ptPath}">
<link rel="alternate" hreflang="en" href="${SITE}${enPath}">
<link rel="alternate" hreflang="x-default" href="${SITE}${enPath}">
<link rel="icon" href="/logo_etm.jpg" type="image/jpeg">
<meta name="theme-color" content="#0a0f0d">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="${c.ogLocale}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${SITE}${p.path}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
${ld({ '@context': 'https://schema.org', '@graph': [ORGANIZATION, WEBSITE, breadcrumb(p.crumbs), ...p.graph] })}
<style>
body{margin:0;background:#050505;color:#e5e7eb;font:17px/1.65 Inter,system-ui,-apple-system,Segoe UI,sans-serif}
main,header,footer{max-width:760px;margin:0 auto;padding:0 16px}
header{padding-top:20px;font-size:14px;color:#9ca3af}
a{color:#c19a6b}h1{font-size:30px;line-height:1.25;margin:24px 0 12px;color:#fff}
h2{font-size:21px;margin:32px 0 8px;color:#fff}
blockquote{margin:16px 0;padding:12px 16px;border-left:3px solid #c19a6b;background:#0d0d0d;font-style:italic}
blockquote cite{display:block;margin-top:6px;font-style:normal;font-size:14px;color:#9ca3af}
.cta{display:inline-block;margin:20px 0;padding:10px 18px;border:1px solid #c19a6b;border-radius:4px;text-decoration:none;font-weight:600}
ul{padding-left:20px}li{margin:6px 0}
footer{margin-top:48px;padding-bottom:32px;border-top:1px solid #1f2937;font-size:14px;color:#9ca3af}
</style>
</head>
<body>
<header><nav>${crumbsHtml} · <a href="${p.altPath}" hreflang="${p.lang === 'pt' ? 'en' : 'pt-BR'}">${c.otherLang}</a></nav></header>
<main>
${p.body}
<p><a class="cta" href="${c.appUrl}">${c.open} →</a></p>
</main>
<footer>
<p><a href="${c.hubPath}">${c.allSigns}</a> · <a href="${c.aboutPath}">${c.about}</a> · <a href="${c.appUrl}">${SITE_NAME}</a></p>
<p>${esc(c.t.signs.disclaimer)} — ${esc(c.t.signs.disclaimerRef)}</p>
</footer>
</body>
</html>
`;
}

function verse(lang: Lang, id: SignId): string {
    const item = COPY[lang].t.signs.items[id];
    return `<blockquote>“${esc(item.quote)}”<cite>${esc(item.ref)} (${COPY[lang].bible})</cite></blockquote>`;
}

function hubPage(lang: Lang): PageSpec {
    const c = COPY[lang];
    const other: Lang = lang === 'pt' ? 'en' : 'pt';
    const items = SIGN_ORDER.map(id => {
        const it = c.t.signs.items[id];
        return `<li><a href="${c.signPath(SLUGS[lang][id])}"><strong>${esc(it.name)}</strong></a> — “${esc(it.quote)}” (${esc(it.ref)})</li>`;
    }).join('\n');
    const body = `<h1>${esc(c.hubTitle)}</h1>
<p>${esc(c.hubIntro)}</p>
<ul>
${items}
</ul>
<h2>${esc(c.omegaTitle)}</h2>
${c.omega.map(t => `<p>${esc(t)}</p>`).join('\n')}
${c.faq.map(([q, a]) => `<h2>${esc(q)}</h2>\n<p>${esc(a)}</p>`).join('\n')}`;
    return {
        lang, path: c.hubPath, altPath: COPY[other].hubPath,
        title: c.hubTitle, description: c.hubDesc,
        crumbs: [[c.home, c.appUrl], [c.allSigns, c.hubPath]],
        graph: [
            {
                '@type': 'CollectionPage', '@id': `${SITE}${c.hubPath}`, url: `${SITE}${c.hubPath}`, name: c.hubTitle,
                description: c.hubDesc, inLanguage: c.htmlLang, isPartOf: { '@id': `${SITE}/#website` },
                mainEntity: {
                    '@type': 'ItemList',
                    itemListElement: SIGN_ORDER.map((id, i) => ({
                        '@type': 'ListItem', position: i + 1, name: c.t.signs.items[id].name, url: `${SITE}${c.signPath(SLUGS[lang][id])}`,
                    })),
                },
            },
            {
                '@type': 'FAQPage', inLanguage: c.htmlLang,
                mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
            },
        ],
        body,
    };
}

function signPage(lang: Lang, id: SignId): PageSpec {
    const c = COPY[lang];
    const other: Lang = lang === 'pt' ? 'en' : 'pt';
    const it = c.t.signs.items[id];
    const [srcName, srcUrl] = SOURCES[id];
    const path = c.signPath(SLUGS[lang][id]);
    const title = lang === 'pt'
        ? `${it.name} (${it.ref}) — sinal dos tempos: dados e fonte`
        : `${it.name} (${it.ref}) — sign of the times: data and source`;
    const description = `“${it.quote}” (${it.ref}). ${MEASURE[lang][id]}`.slice(0, 300);
    const idx = SIGN_ORDER.indexOf(id);
    const next = SIGN_ORDER[(idx + 1) % SIGN_ORDER.length];
    const body = `<h1>${esc(it.name)}</h1>
${verse(lang, id)}
<h2>${c.measured}</h2>
<p>${esc(MEASURE[lang][id])}</p>
<p>${c.source}: <a href="${srcUrl}" rel="noopener">${esc(srcName)}</a></p>
<h2>${c.method}</h2>
<p>${esc(c.t.signs.method)}</p>
<p>→ <a href="${c.signPath(SLUGS[lang][next])}">${esc(c.t.signs.items[next].name)}</a></p>`;
    return {
        lang, path, altPath: COPY[other].signPath(SLUGS[other][id]),
        title, description,
        crumbs: [[c.home, c.appUrl], [c.allSigns, c.hubPath], [it.name, path]],
        graph: [{
            '@type': 'Article', '@id': `${SITE}${path}#article`, headline: title.slice(0, 110), description,
            inLanguage: c.htmlLang, url: `${SITE}${path}`, mainEntityOfPage: `${SITE}${path}`, image: OG_IMAGE,
            author: { '@id': `${SITE}/#org` }, publisher: { '@id': `${SITE}/#org` },
            isBasedOn: { '@type': 'Dataset', name: srcName, url: srcUrl },
            citation: `${it.ref} (${c.bible})`,
        }],
        body,
    };
}

function aboutPage(lang: Lang): PageSpec {
    const c = COPY[lang];
    const other: Lang = lang === 'pt' ? 'en' : 'pt';
    const credits = c.t.credits;
    const groups = Array.from(new Set(CREDITS.map(cr => cr.group)));
    const sources = groups.map(g => {
        const rows = CREDITS.filter(cr => cr.group === g).map(cr => {
            const name = cr.name === 'newsOutlets' ? credits.newsOutlets : cr.name;
            const license = typeof cr.license === 'string' ? cr.license : credits.licenses[cr.license.key];
            const label = cr.url ? `<a href="${cr.url}" rel="noopener">${esc(name)}</a>` : esc(name);
            return `<li>${label} — ${esc(license)}</li>`;
        }).join('\n');
        return `<h3>${esc(credits.groups[g])}</h3>\n<ul>\n${rows}\n</ul>`;
    }).join('\n');
    const body = `<h1>${esc(c.aboutTitle)}</h1>
${c.aboutIntro.map(t => `<p>${esc(t)}</p>`).join('\n')}
<h2>${c.method}</h2>
<p>${esc(c.t.signs.method)} <a href="${c.hubPath}">${c.allSigns}</a>.</p>
<h2>${c.sourcesTitle}</h2>
${sources}
<p>${c.creator} <a href="https://instagram.com/jonataribas" rel="noopener">@jonataribas</a>.</p>`;
    return {
        lang, path: c.aboutPath, altPath: COPY[other].aboutPath,
        title: c.aboutTitle, description: c.aboutDesc,
        crumbs: [[c.home, c.appUrl], [c.about, c.aboutPath]],
        graph: [{ '@type': 'AboutPage', '@id': `${SITE}${c.aboutPath}`, url: `${SITE}${c.aboutPath}`, name: c.aboutTitle, inLanguage: c.htmlLang, about: { '@id': `${SITE}/#org` } }],
        body,
    };
}

function allPages(): PageSpec[] {
    return (['pt', 'en'] as Lang[]).flatMap(lang => [hubPage(lang), ...SIGN_ORDER.map(id => signPage(lang, id)), aboutPage(lang)]);
}

function sitemap(pages: PageSpec[], now: Date): string {
    const day = now.toISOString().slice(0, 10);
    const urls = ['/', ...pages.map(p => p.path)];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${day}</lastmod></url>`).join('\n')}
</urlset>
`;
}

function llmsTxt(): string {
    const line = (lang: Lang, id: SignId) => {
        const it = COPY[lang].t.signs.items[id];
        return `- [${it.name} (${it.ref})](${SITE}${COPY[lang].signPath(SLUGS[lang][id])}): ${MEASURE[lang][id]}`;
    };
    return [
        `# ${SITE_NAME}`,
        '',
        `> ${COPY.en.hubIntro} Live map of conflicts, earthquakes, disasters and news, plus an index (Ω) of the biblical signs of the times computed from public data. Bilingual: English and Brazilian Portuguese.`,
        '',
        '## Pages',
        '',
        `- [Live dashboard](${SITE}/)`,
        `- [Signs of the times (EN)](${SITE}${COPY.en.hubPath})`,
        `- [Sinais dos tempos (PT-BR)](${SITE}${COPY.pt.hubPath})`,
        `- [About, method and data sources](${SITE}${COPY.en.aboutPath})`,
        `- [Sitemap](${SITE}/sitemap.xml)`,
        '',
        '## Signs (EN)',
        '',
        ...SIGN_ORDER.map(id => line('en', id)),
        '',
        '## Sinais (PT-BR)',
        '',
        ...SIGN_ORDER.map(id => line('pt', id)),
        '',
    ].join('\n');
}

/** Arquivos gerados no build: caminho dentro de dist → conteúdo. */
export function seoFiles(now = new Date()): Record<string, string> {
    const pages = allPages();
    const files: Record<string, string> = {};
    for (const p of pages) files[`${p.path.slice(1)}index.html`] = render(p);
    files['sitemap.xml'] = sitemap(pages, now);
    files['llms.txt'] = llmsTxt();
    return files;
}
