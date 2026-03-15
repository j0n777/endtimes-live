import React from 'react';
import { Layers, ExternalLink } from 'lucide-react';
import { DefconLevel, DefconMeta } from '../utils/defconCalculator';
import { OmegaLevel, OmegaMeta } from '../utils/omegaCalculator';
import { useLocale } from '../lib/i18n';

interface StatusBarProps {
  omegaLevel: OmegaLevel;
  omegaMeta: OmegaMeta;
  defconLevel: DefconLevel;
  defconMeta: DefconMeta;
  osintDefcon: { level: number; codename: string; source: string } | null;
  filteredCount: number;
  totalCount: number;
  activeSourceCount: number;
  totalSourceCount: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  omegaLevel,
  omegaMeta,
  defconLevel,
  defconMeta,
  osintDefcon,
  filteredCount,
  totalCount,
  activeSourceCount,
  totalSourceCount,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const { t, locale, setLocale } = useLocale();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-8 bg-black/90 border-t border-tactical-800/60 flex items-center px-3 gap-0 text-[10px] font-mono select-none backdrop-blur-sm">

      {/* ── Omega Index ─────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-1.5 pr-3 border-r border-tactical-800/50 cursor-help shrink-0`}
        title={`Omega Index ${omegaLevel} — ${omegaMeta.codename}: ${omegaMeta.desc}`}
      >
        <span className="text-gray-600 font-bold">Ω</span>
        <span className={`font-bold tracking-wider ${omegaMeta.textColor}`}>
          {omegaLevel} · {omegaMeta.codename}
        </span>
      </div>

      {/* ── DEFCON ──────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-1.5 px-3 border-r border-tactical-800/50 cursor-help shrink-0`}
        title={osintDefcon
          ? `DEFCON ${defconLevel} — ${defconMeta.codename} (${t.defcon.osintTooltip})`
          : `DEFCON ${defconLevel} — ${defconMeta.codename}: ${defconMeta.desc}`
        }
      >
        <div className="flex gap-0.5">
          {([1, 2, 3, 4, 5] as const).map(n => (
            <div
              key={n}
              className={`w-1 h-2.5 rounded-sm ${
                n >= defconLevel ? defconMeta.dotColor : 'bg-gray-800'
              } ${n === defconLevel && defconMeta.pulse ? 'animate-pulse' : ''}`}
            />
          ))}
        </div>
        <span className={`font-bold tracking-wider ${defconMeta.textColor}`}>
          DEFCON {defconLevel}
        </span>
        {osintDefcon && (
          <span className="text-gray-700 text-[9px]">OSINT</span>
        )}
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

      {/* ── Creator ─────────────────────────────────────────────── */}
      <a
        href="https://instagram.com/jonataribas"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-3 border-l border-tactical-800/50 text-gray-700 hover:text-gray-400 transition-colors shrink-0"
        title="@jonataribas — creator"
      >
        <ExternalLink className="w-2.5 h-2.5" />
        <span>@jonataribas</span>
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

    </div>
  );
};
