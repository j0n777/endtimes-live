// Limites do que o Google mostra no resultado (05/11/2026): acima disso o título e a
// descrição aparecem cortados. Módulo à parte para o app (SEOHead) usar sem carregar
// o texto das páginas estáticas.
export const SITE_NAME = 'End Times Monitor';
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/** Acrescenta a marca só se o título ainda couber. */
export function withBrand(title: string): string {
    const branded = `${title} | ${SITE_NAME}`;
    return branded.length <= TITLE_MAX ? branded : title;
}

/** Corta no fim de uma palavra e marca o corte com reticências. */
export function clipDescription(text: string, max = DESCRIPTION_MAX): string {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    const end = cut.lastIndexOf(' ');
    return `${(end > max * 0.6 ? cut.slice(0, end) : cut).replace(/[\s,;:.—–-]+$/, '')}…`;
}

/** Descrição da home, a mesma no index.html (robôs sem JS) e no SEOHead. */
export const HOME_DESCRIPTION = 'Live map of wars, earthquakes, disasters and news, plus the Ω index of the biblical signs of the times (Matthew 24, Luke 21) from public data.';
