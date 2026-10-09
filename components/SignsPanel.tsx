import React, { useEffect, useState } from 'react';
import { ExternalLink, Minus, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useLocale } from '../lib/i18n';
import { OMEGA_META } from '../utils/omegaCalculator';
import type { SignReading, SignsPayload } from '../lib/signs/types';
import type { EwsPayload } from '../lib/ews/types';
import { dataUrl } from '../lib/dataUrl';
import { signInfoPath } from '../lib/seo/slugs';

interface SignsPanelProps {
  signs: SignsPayload | null;
  onClose: () => void;
}

const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));

// Cor da barra pelo percentil: só fica vermelho o que é de fato anômalo (≥ 90).
const barColor = (p: number) =>
  p >= 90 ? 'bg-red-500' : p >= 75 ? 'bg-orange-500' : p >= 50 ? 'bg-yellow-600' : 'bg-tactical-600';

const TrendIcon: React.FC<{ trend: SignReading['trend'] }> = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-orange-400" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-sky-400" />;
  if (trend === 'flat') return <Minus className="w-3 h-3 text-gray-500" />;
  return null;
};

export const SignsPanel: React.FC<SignsPanelProps> = ({ signs, onClose }) => {
  const { t, locale } = useLocale();
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const omega = signs?.omega.level ? OMEGA_META[signs.omega.level] : null;
  const [ews, setEws] = useState<EwsPayload | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(dataUrl('ews.json'))
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && Array.isArray(d?.cohorts)) setEws(d); })
      .catch(() => { /* sem alerta de jatos nesta abertura */ });
    return () => { alive = false; };
  }, []);
  const ewsLive = ews?.cohorts.filter(c => c.airborne != null) ?? [];

  return (
    <div
      className="fixed bottom-9 left-2 z-50 w-[380px] max-w-[calc(100vw-1rem)] max-h-[70vh] overflow-y-auto custom-scrollbar bg-black/95 border border-tactical-800/70 font-mono text-[11px] text-gray-300 shadow-2xl backdrop-blur-sm"
      role="dialog"
      aria-label={t.signs.title}
    >
      <div className="sticky top-0 bg-black/95 border-b border-tactical-800/60 px-3 py-2 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-500 tracking-widest">{t.signs.title}</div>
          {signs ? (
            <div className={`font-bold tracking-wider ${omega ? omega.textColor : 'text-gray-500'}`}>
              Ω {signs.omega.level ?? '—'}{omega ? ` · ${omega.codename}` : ''}
            </div>
          ) : (
            <div className="text-gray-500">{t.signs.loading}</div>
          )}
          {signs && (
            <div className="text-[10px] text-gray-500 mt-0.5">
              {signs.omega.level
                ? fill(t.signs.anomalous, { n: signs.omega.anomalous.length, m: signs.omega.usable })
                : t.signs.insufficient}
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 shrink-0" aria-label="close">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="px-3 pt-2 text-[10px] text-gray-500 leading-relaxed">{t.signs.method}</p>

      <ul className="px-3 py-2 space-y-3">
        {signs?.signs.map(s => {
          const item = t.signs.items[s.id];
          const measured = s.status === 'ok' || s.status === 'short-baseline';
          const p = s.percentile ?? 0;
          return (
            <li key={s.id} className="border-b border-tactical-900/60 pb-2.5 last:border-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-200 tracking-wide">{item.name}</span>
                {measured && <TrendIcon trend={s.trend} />}
                {measured && s.trend && <span className="text-[10px] text-gray-500">{t.signs.trend[s.trend]}</span>}
                <span className="flex-1" />
                {measured && s.percentile !== null && (
                  <span className={`tabular-nums ${p >= 90 ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                    {fill(t.signs.percentile, { p: nf.format(p) })}
                  </span>
                )}
              </div>

              {measured && s.percentile !== null && (
                <div className="relative h-1.5 bg-gray-800/80 mt-1.5" aria-hidden>
                  <div className={`h-full ${barColor(p)}`} style={{ width: `${Math.max(2, p)}%` }} />
                  <div className="absolute top-[-2px] bottom-[-2px] w-px bg-gray-400/70" style={{ left: '90%' }} />
                </div>
              )}

              <div className="text-gray-400 mt-1.5 leading-snug">
                {s.status === 'unavailable'
                  ? item.value
                  : measured
                    ? fill(item.value, {
                        v: s.value === null ? '—' : nf.format(s.value),
                        b: s.baselineMean === null ? '—' : nf.format(s.baselineMean),
                        period: s.period ?? '',
                        ...Object.fromEntries(Object.entries(s.extra ?? {}).map(([k, n]) => [k, nf.format(n as number)])),
                      })
                    : null}
              </div>

              <div className="text-[10px] text-gray-500 italic mt-1 leading-snug">
                “{item.quote}” — <span className="not-italic">{item.ref}</span>
              </div>

              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-600">
                {s.status !== 'ok' && (
                  <span className="text-yellow-600/90">{t.signs.status[s.status]}</span>
                )}
                {measured && s.baselineSpan && <span>{fill(t.signs.baseline, { span: s.baselineSpan })}</span>}
                <a href={signInfoPath(locale === 'pt-BR' ? 'pt' : 'en', s.id)} className="text-tactical-500 hover:text-tactical-400 shrink-0">
                  {t.signs.learnMore}
                </a>
                <span className="flex-1" />
                <a
                  href={s.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-gray-300 truncate max-w-[55%]"
                  title={`${t.signs.source}: ${s.sourceName}`}
                >
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{s.sourceName}</span>
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-tactical-800/60 px-3 py-2 text-[10px] text-gray-500 leading-relaxed">
        <p className="italic">“{t.signs.disclaimer}”</p>
        <p className="mt-0.5">— {t.signs.disclaimerRef}</p>
        {signs?.context?.co2 && (
          <p className="mt-1.5">
            {fill(t.signs.co2, {
              v: nf.format(signs.context.co2.ppm),
              date: signs.context.co2.date,
              y: signs.context.co2.yearAgoPpm != null ? nf.format(signs.context.co2.yearAgoPpm) : '—',
            })}
          </p>
        )}
        {ewsLive.map(c => (
          <p key={c.id} className="mt-1">
            {c.level != null
              ? fill(t.signs.ews[c.id], { level: c.level, n: nf.format(c.airborne ?? 0), e: nf.format(c.expected ?? 0) })
              : fill(t.signs.ewsCalibrating[c.id], { n: nf.format(c.airborne ?? 0), w: c.weeks, m: ews?.minWeeks ?? 3 })}
          </p>
        ))}
        {ewsLive.length > 0 && (
          <p className="mt-0.5 text-gray-500">
            <a href="https://ews.kylemcdonald.net/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
              {t.signs.ewsMethod} ↗
            </a>
            {' · '}
            <a href="https://adsb.lol/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
              {t.signs.ewsData} ↗
            </a>
          </p>
        )}
        {signs && (
          <p className="mt-1.5 text-gray-600">
            {fill(t.signs.updated, {
              when: new Date(signs.generatedAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }),
            })}
          </p>
        )}
      </div>
    </div>
  );
};
