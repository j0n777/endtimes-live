import React from 'react';
import { ExternalLink, X } from 'lucide-react';
import { useLocale } from '../lib/i18n';
import { CREDITS, type CreditGroup } from '../lib/credits';

const GROUPS: CreditGroup[] = ['maps', 'signs', 'layers', 'events', 'method'];

export const CreditsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useLocale();
  return (
    <div
      className="fixed bottom-9 right-2 z-50 w-[380px] max-w-[calc(100vw-1rem)] max-h-[70vh] overflow-y-auto custom-scrollbar bg-black/95 border border-tactical-800/70 font-mono text-[11px] text-gray-300 shadow-2xl backdrop-blur-sm"
      role="dialog"
      aria-label={t.credits.title}
    >
      <div className="sticky top-0 bg-black/95 border-b border-tactical-800/60 px-3 py-2 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-500 tracking-widest">{t.credits.title}</div>
          <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{t.credits.intro}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white" aria-label={t.credits.close}>
          <X className="w-4 h-4" />
        </button>
      </div>
      {GROUPS.map(group => (
        <section key={group} className="px-3 py-2 border-b border-tactical-800/40 last:border-b-0">
          <h3 className="text-[10px] text-gray-500 tracking-widest mb-1">{t.credits.groups[group]}</h3>
          <ul className="space-y-1">
            {CREDITS.filter(c => c.group === group).map(c => {
              const name = c.name === 'newsOutlets' ? t.credits.newsOutlets : c.name;
              const license = typeof c.license === 'string' ? c.license : t.credits.licenses[c.license.key];
              return (
                <li key={c.name} className="leading-snug">
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white inline-flex items-start gap-1">
                      <span>{name}</span>
                      <ExternalLink className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-gray-300">{name}</span>
                  )}
                  <span className="text-gray-600"> · {license}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};
