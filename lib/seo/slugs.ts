// Endereços das páginas estáticas dos sinais (lib/seo/pages.ts). Separado para o app
// linkar essas páginas sem carregar o texto delas no bundle.
import type { SignId } from '../signs/types';

export type Lang = 'pt' | 'en';

export const SIGN_ORDER: SignId[] = ['earthquakes', 'wars', 'famine', 'pestilence', 'heavens', 'sea', 'persecution', 'distress', 'gospel'];

export const SLUGS: Record<Lang, Record<SignId, string>> = {
    pt: {
        earthquakes: 'terremotos', wars: 'guerras', famine: 'fome', pestilence: 'pestes', heavens: 'sinais-no-sol',
        sea: 'bramido-do-mar', persecution: 'perseguicao', distress: 'angustia-das-nacoes', gospel: 'evangelho',
    },
    en: {
        earthquakes: 'earthquakes', wars: 'wars', famine: 'famine', pestilence: 'pestilences', heavens: 'signs-in-the-sun',
        sea: 'roaring-sea', persecution: 'persecution', distress: 'distress-of-nations', gospel: 'gospel',
    },
};

/** Página "saiba mais" de um sinal, linkada no painel de sinais. */
export const signInfoPath = (lang: Lang, id: SignId): string =>
    lang === 'pt' ? `/sinais/${SLUGS.pt[id]}/` : `/en/signs/${SLUGS.en[id]}/`;
