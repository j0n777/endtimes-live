import React, { useState } from 'react';
import { Layers, ExternalLink, Info } from 'lucide-react';
import { OMEGA_META } from '../utils/omegaCalculator';
import { useLocale } from '../lib/i18n';
import { SignsPanel } from './SignsPanel';
import { CreditsPanel } from './CreditsPanel';
import type { SignsPayload } from '../lib/signs/types';

// Tensão Militar: 1 baixa … 5 crítica (cresce com o número, ao contrário do DEFCON).
const TENSION_STYLE = {
  1: { text: 'text-sky-400', bar: 'bg-sky-600', pulse: false },
  2: { text: 'text-blue-400', bar: 'bg-blue-500', pulse: false },
  3: { text: 'text-yellow-400', bar: 'bg-yellow-500', pulse: false },
  4: { text: 'text-orange-400', bar: 'bg-orange-500', pulse: true },
  5: { text: 'text-red-400', bar: 'bg-red-500', pulse: true },
} as const;

interface StatusBarProps {
  signs: SignsPayload | null;
  filteredCount: number;
  totalCount: number;
  activeSourceCount: number;
  totalSourceCount: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  signs,
  filteredCount,
  totalCount,
  activeSourceCount,
  totalSourceCount,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const { t, locale, setLocale } = useLocale();
  const [signsOpen, setSignsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);

  const omegaLevel = signs?.omega.level ?? null;
  const omegaMeta = omegaLevel ? OMEGA_META[omegaLevel] : null;
  const tensionLevel = signs?.tension.level ?? null;
  const tensionStyle = tensionLevel ? TENSION_STYLE[tensionLevel] : null;
  const tension = signs?.tension;
  const tensionTitle = tension?.value != null && tension.percentile != null
    ? t.tension.tooltip
        .replace('{v}', tension.value.toLocaleString(locale))
        .replace('{p}', String(Math.round(tension.percentile)))
        .replace('{d}', tension.date ?? '—')
    : t.tension.none;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-8 bg-black/90 border-t border-tactical-800/60 flex items-center px-3 gap-0 text-[10px] font-mono select-none backdrop-blur-sm">

      {/* ── Omega Index: abre o painel dos sinais ───────────────── */}
      <button
        onClick={() => setSignsOpen(open => !open)}
        className={`flex items-center gap-1.5 pr-3 border-r border-tactical-800/50 shrink-0 hover:bg-tactical-900/40 transition-colors ${signsOpen ? 'bg-tactical-900/50' : ''}`}
        title={omegaMeta ? `Omega Index ${omegaLevel} — ${omegaMeta.codename}: ${omegaMeta.desc}` : t.signs.title}
        aria-expanded={signsOpen}
      >
        <span className="text-gray-600 font-bold">Ω</span>
        <span className={`font-bold tracking-wider ${omegaMeta ? omegaMeta.textColor : 'text-gray-600'}`}>
          {omegaMeta ? `${omegaLevel} · ${omegaMeta.codename}` : '—'}
        </span>
      </button>

      {/* ── Tensão Militar (substitui o DEFCON) ─────────────────── */}
      <div
        className="flex items-center gap-1.5 px-3 border-r border-tactical-800/50 cursor-help shrink-0"
        title={tensionTitle}
      >
        <div className="flex gap-0.5">
          {([1, 2, 3, 4, 5] as const).map(n => (
            <div
              key={n}
              className={`w-1 h-2.5 rounded-sm ${
                tensionLevel && n <= tensionLevel && tensionStyle ? tensionStyle.bar : 'bg-gray-800'
              } ${n === tensionLevel && tensionStyle?.pulse ? 'animate-pulse' : ''}`}
            />
          ))}
        </div>
        <span className={`font-bold tracking-wider ${tensionStyle ? tensionStyle.text : 'text-gray-600'}`}>
          <span className="hidden sm:inline">{t.tension.label} · </span>
          {tensionLevel ? t.tension.levels[tensionLevel - 1] : '—'}
        </span>
      </div>

      {/* ── Spacer ──────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Sources / Visible ───────────────────────────────────── */}
      {totalSourceCount > 0 && (
        <div className="flex items-center gap-2 px-3 border-l border-tactical-800/50 shrink-0 text-gray-600">
          <span>
            <span className="text-gray-400">{activeSourceCount}</span>/{totalSourceCount} {t.header.sources}
          </span>
          <span className="text-tactical-800/80">·</span>
          <span>
            <span className="text-gray-400">{filteredCount}</span>/{totalCount} {t.header.visible}
          </span>
        </div>
      )}

      {/* ── Sources & credits ─────────────────────────────────────── */}
      <button
        onClick={() => setCreditsOpen(open => !open)}
        className={`flex items-center gap-1.5 px-3 border-l border-tactical-800/50 transition-colors shrink-0 ${creditsOpen ? 'text-gray-300' : 'text-gray-600 hover:text-gray-300'}`}
        aria-expanded={creditsOpen}
        aria-label={t.credits.title}
        title={t.credits.title}
      >
        <Info className="w-3 h-3" />
        <span className="hidden sm:inline">{t.credits.button}</span>
      </button>

      {/* ── Creator ─────────────────────────────────────────────── */}
      <a
        href="https://instagram.com/jonataribas"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-3 border-l border-tactical-800/50 text-gray-700 hover:text-gray-400 transition-colors shrink-0"
        title="@jonataribas — creator"
      >
        <ExternalLink className="w-2.5 h-2.5" />
        <span className="hidden sm:inline">@jonataribas</span>
      </a>

      {/* ── Language toggle ──────────────────────────────────────── */}
      <button
        onClick={() => setLocale(locale === 'en' ? 'pt-BR' : 'en')}
        className="px-3 border-l border-tactical-800/50 text-gray-600 hover:text-gray-300 transition-colors font-bold shrink-0"
        title={locale === 'en' ? 'Mudar para Português' : 'Switch to English'}
      >
        {locale === 'en' ? '🇧🇷' : '🇺🇸'}
      </button>

      {/* ── Layers / Filter button ───────────────────────────────── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`flex items-center gap-1.5 px-3 border-l border-tactical-800/50 transition-colors shrink-0 ${
          sidebarOpen
            ? 'text-tactical-400 bg-tactical-900/50'
            : 'text-gray-600 hover:text-gray-300'
        }`}
        title={t.header.intel}
      >
        <Layers className="w-3 h-3" />
        <span className="hidden sm:inline">{t.header.intel}</span>
      </button>

      {signsOpen && <SignsPanel signs={signs} onClose={() => setSignsOpen(false)} />}
      {creditsOpen && <CreditsPanel onClose={() => setCreditsOpen(false)} />}
    </div>
  );
};
