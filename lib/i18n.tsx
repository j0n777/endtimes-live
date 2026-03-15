/**
 * Lightweight i18n — zero external dependencies.
 * Supports: 'en' | 'pt-BR'
 * Usage:  const { t, locale, setLocale } = useLocale();
 *         t.nav.situation  →  "SITUAÇÃO" (pt-BR) or "SITUATION" (en)
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { en, Translations } from '../locales/en';
import { ptBR } from '../locales/pt-BR';

export type Locale = 'en' | 'pt-BR';

const LOCALES: Record<Locale, Translations> = { en, 'pt-BR': ptBR };
const STORAGE_KEY = 'etm_locale';

function detectLocale(): Locale {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && stored in LOCALES) return stored;
    // Auto-detect from browser
    const browser = navigator.language || 'en';
    if (browser.startsWith('pt')) return 'pt-BR';
    return 'en';
}

interface I18nContextType {
    t: Translations;
    locale: Locale;
    setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextType>({
    t: en,
    locale: 'en',
    setLocale: () => {},
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<Locale>(detectLocale);

    const setLocale = useCallback((l: Locale) => {
        localStorage.setItem(STORAGE_KEY, l);
        setLocaleState(l);
    }, []);

    return (
        <I18nContext.Provider value={{ t: LOCALES[locale], locale, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useLocale = () => useContext(I18nContext);
