import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MonitorEvent } from '../types';
import { ArrowLeft, Check, ExternalLink, MapPin, Play, Search, Send, Share2 } from 'lucide-react';
import { CATEGORY_COLORS } from '../categoryColors';
import { useLocale } from '../lib/i18n';

// LIVE WIRE redesenhado (05/11/2026): lista única por tempo + painel de leitura,
// com busca, filtros de categoria e fonte, e "ver no mapa". Antes era uma grade de
// 3 colunas de cartões iguais, sem como filtrar nem abrir um item.

export const TELEGRAM_CHANNEL_URL = 'https://t.me/geopoliticaenoticias';

type SourceFilter = 'ALL' | 'OWN' | 'PRESS' | 'OFFICIAL';

const isOwnChannel = (e: MonitorEvent) =>
  /geopoliticaenoticias/i.test(`${e.sourceName ?? ''} ${e.sourceUrl ?? ''}`);
const isOfficial = (e: MonitorEvent) => {
  const type = String(e.sourceType);
  return type === 'OFFICIAL' || type === 'GOV_OFFICIAL';
};
const sourceOf = (e: MonitorEvent): Exclude<SourceFilter, 'ALL'> =>
  isOwnChannel(e) ? 'OWN' : isOfficial(e) ? 'OFFICIAL' : 'PRESS';
const hasPlace = (e: MonitorEvent) =>
  !!e.coordinates && (Math.abs(e.coordinates.lat) > 0.0001 || Math.abs(e.coordinates.lng) > 0.0001);
const colorOf = (e: MonitorEvent) => (CATEGORY_COLORS as Record<string, string>)[e.category] || '#94a3b8';

type Group = 'now' | 'today' | 'yesterday' | 'older';
function groupOf(ts: number, now: Date): Group {
  if (now.getTime() - ts < 3600_000) return 'now';
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (ts >= startToday) return 'today';
  if (ts >= startToday - 86400_000) return 'yesterday';
  return 'older';
}

interface IntelFeedProps {
  events: MonitorEvent[];
  onShowOnMap?: (eventId: string) => void;
}

const IntelFeed: React.FC<IntelFeedProps> = ({ events, onShowOnMap }) => {
  const { t, locale } = useLocale();
  const lw = t.liveWire;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [source, setSource] = useState<SourceFilter>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const rtf = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' }), [locale]);
  const ago = (ts: number) => {
    const min = Math.round((ts - Date.now()) / 60000);
    if (Math.abs(min) < 60) return rtf.format(min, 'minute');
    const h = Math.round(min / 60);
    if (Math.abs(h) < 48) return rtf.format(h, 'hour');
    return rtf.format(Math.round(h / 24), 'day');
  };
  const catLabel = (c: string) => (lw.cat as Record<string, string>)[c] ?? c;

  const sorted = useMemo(
    () => [...events]
      .map(e => ({ e, ts: new Date(e.timestamp).getTime() || 0 }))
      .sort((a, b) => b.ts - a.ts),
    [events],
  );

  // Contagem por categoria considerando a fonte escolhida, para os chips mostrarem o que existe.
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { e } of sorted) {
      if (source !== 'ALL' && sourceOf(e) !== source) continue;
      const label = catLabel(e.category);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [sorted, source, lw]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter(({ e }) =>
      (source === 'ALL' || sourceOf(e) === source)
      && (category === 'ALL' || catLabel(e.category) === category)
      && (!q || `${e.title} ${e.location} ${e.sourceName ?? ''} ${e.description ?? ''}`.toLowerCase().includes(q)));
  }, [sorted, query, category, source, lw]);

  // Mantém uma seleção válida: o mais recente quando nada (ou algo filtrado) está selecionado.
  useEffect(() => {
    if (!visible.some(({ e }) => e.id === selectedId)) setSelectedId(visible[0]?.e.id ?? null);
  }, [visible, selectedId]);

  const selected = visible.find(({ e }) => e.id === selectedId)?.e ?? null;
  // Posts do Telegram repetem a manchete na primeira linha do texto.
  const body = selected?.description && selected.description.trim().startsWith(selected.title.trim())
    ? selected.description.trim().slice(selected.title.trim().length).trim()
    : selected?.description?.trim() ?? '';

  const select = (id: string, openOnMobile = true) => {
    setSelectedId(id);
    setCopied(false);
    if (openOnMobile) setMobileOpen(true);
  };

  const onListKey = (ev: React.KeyboardEvent) => {
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
    ev.preventDefault();
    const i = visible.findIndex(({ e }) => e.id === selectedId);
    const next = visible[Math.min(visible.length - 1, Math.max(0, i + (ev.key === 'ArrowDown' ? 1 : -1)))];
    if (!next) return;
    select(next.e.id, false);
    listRef.current?.querySelector(`[data-id="${CSS.escape(next.e.id)}"]`)?.scrollIntoView({ block: 'nearest' });
  };

  const share = async (e: MonitorEvent) => {
    const url = `${window.location.origin}/?tab=map&event=${encodeURIComponent(e.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: e.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Compartilhamento cancelado pelo usuário: nada a fazer.
    }
  };

  // Lista agrupada por período.
  const rows: React.ReactNode[] = [];
  let lastGroup: Group | null = null;
  const now = new Date();
  for (const { e, ts } of visible) {
    const g = groupOf(ts, now);
    if (g !== lastGroup) {
      rows.push(
        <div key={`g-${g}`} className="sticky top-0 z-10 bg-[#050505]/95 backdrop-blur px-3 py-1.5 text-[10px] font-bold tracking-widest text-gray-500 border-b border-tactical-900">
          {lw.groups[g]}
        </div>,
      );
      lastGroup = g;
    }
    const active = e.id === selectedId;
    const own = isOwnChannel(e);
    rows.push(
      <button
        key={e.id}
        data-id={e.id}
        onClick={() => select(e.id)}
        className={`w-full text-left flex gap-3 px-3 py-2.5 border-b border-tactical-900/70 border-l-2 transition-colors ${active ? 'bg-tactical-900/60' : 'hover:bg-white/[0.03]'}`}
        style={{ borderLeftColor: active ? colorOf(e) : 'transparent' }}
        aria-current={active}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colorOf(e) }} />
            <span className="font-bold uppercase tracking-wider" style={{ color: colorOf(e) }}>{catLabel(e.category)}</span>
            <span>·</span>
            <span className="whitespace-nowrap">{ago(ts)}</span>
            {own && <span className="ml-1 px-1 rounded-sm bg-sky-900/50 text-sky-300 font-bold tracking-wider">{lw.ownBadge}</span>}
            {(e.severity === 'CRITICAL' || e.severity === 'HIGH') && (
              <span className={`ml-auto font-bold ${e.severity === 'CRITICAL' ? 'text-red-400' : 'text-orange-400'}`}>{e.severity}</span>
            )}
          </div>
          <div className={`text-[13px] leading-snug line-clamp-2 ${active ? 'text-white' : 'text-gray-300'}`}>{e.title}</div>
          <div className="mt-0.5 text-[10px] text-gray-600 truncate">
            {e.sourceName}{hasPlace(e) && e.location ? ` · ${e.location}` : ''}
          </div>
        </div>
        {e.mediaUrl && (
          <div className="w-16 h-12 shrink-0 bg-black border border-tactical-800/60 overflow-hidden flex items-center justify-center">
            {e.mediaType === 'video'
              ? <Play className="w-4 h-4 text-gray-500" />
              : <img src={e.mediaUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover"
                  onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }} />}
          </div>
        )}
      </button>,
    );
  }

  const detail = selected && (
    <article className="max-w-3xl mx-auto p-4 md:p-6">
      <button onClick={() => setMobileOpen(false)} className="lg:hidden flex items-center gap-1 text-xs text-gray-400 mb-3">
        <ArrowLeft className="w-4 h-4" /> {lw.back}
      </button>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mb-2">
        <span className="px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider text-black" style={{ background: colorOf(selected) }}>
          {catLabel(selected.category)}
        </span>
        <span>{new Date(selected.timestamp).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{hasPlace(selected) ? selected.location : lw.noPlace}</span>
      </div>
      <h1 className="text-lg md:text-2xl font-bold text-white leading-snug mb-4 font-sans">{selected.title}</h1>
      {selected.mediaUrl && (
        <div className="mb-4 border border-tactical-800/60 bg-black">
          {selected.mediaType === 'video'
            ? <video key={selected.id} src={selected.mediaUrl} controls preload="metadata" className="w-full max-h-[60vh]" />
            : <img src={selected.mediaUrl} alt="" referrerPolicy="no-referrer" className="w-full max-h-[60vh] object-contain"
                onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }} />}
        </div>
      )}
      {body && (
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line font-sans mb-5">{body}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {onShowOnMap && hasPlace(selected) && (
          <button onClick={() => onShowOnMap(selected.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-tactical-500/70 text-tactical-500 hover:bg-tactical-900/60">
            <MapPin className="w-3.5 h-3.5" /> {lw.showOnMap}
          </button>
        )}
        {selected.sourceUrl && (
          <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-tactical-800 text-gray-300 hover:bg-white/5">
            <ExternalLink className="w-3.5 h-3.5" /> {lw.openSource}
          </a>
        )}
        <button onClick={() => share(selected)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs border border-tactical-800 text-gray-300 hover:bg-white/5">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />} {copied ? lw.copied : lw.share}
        </button>
      </div>
      <p className="mt-4 text-[11px] text-gray-600">{selected.sourceName}</p>
    </article>
  );

  return (
    <div className="h-full bg-[#050505] text-gray-200 font-mono flex flex-col">
      {/* Cabeçalho + filtros */}
      <div className="shrink-0 border-b border-tactical-800 bg-tactical-900/60 px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-gray-200 font-bold tracking-widest text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {lw.title}
          </h2>
          <span className="text-[10px] text-gray-500">
            {lw.count.replace('{n}', String(visible.length)).replace('{m}', String(events.length))}
          </span>
          <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" title={lw.telegramTitle}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-sm bg-sky-700/80 hover:bg-sky-600 text-white">
            <Send className="w-3 h-3" /> <span className="hidden sm:inline">{lw.telegramCta}</span><span className="sm:hidden">Telegram</span>
          </a>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <label className="flex items-center gap-2 flex-1 px-2 py-1.5 bg-black/60 border border-tactical-800 focus-within:border-tactical-500">
            <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input value={query} onChange={ev => setQuery(ev.target.value)} placeholder={lw.search}
              className="flex-1 min-w-0 bg-transparent text-xs text-gray-200 placeholder-gray-600 outline-none" />
          </label>
          <div className="flex gap-1 overflow-x-auto custom-scrollbar" role="radiogroup">
            {(['ALL', 'OWN', 'PRESS', 'OFFICIAL'] as SourceFilter[]).map(s => (
              <button key={s} role="radio" aria-checked={source === s} onClick={() => { setSource(s); setCategory('ALL'); }}
                className={`shrink-0 px-2 py-1 text-[11px] border whitespace-nowrap ${source === s ? 'border-tactical-500 text-tactical-500 bg-tactical-900' : 'border-tactical-800 text-gray-500 hover:text-gray-300'}`}>
                {lw.sources[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-0.5">
          <button onClick={() => setCategory('ALL')}
            className={`shrink-0 px-2 py-0.5 text-[10px] rounded-full border ${category === 'ALL' ? 'border-gray-300 text-white' : 'border-tactical-800 text-gray-500 hover:text-gray-300'}`}>
            {lw.all}
          </button>
          {categoryCounts.map(([label, n]) => (
            <button key={label} onClick={() => setCategory(category === label ? 'ALL' : label)}
              className={`shrink-0 px-2 py-0.5 text-[10px] rounded-full border whitespace-nowrap ${category === label ? 'border-gray-300 text-white bg-white/10' : 'border-tactical-800 text-gray-500 hover:text-gray-300'}`}>
              {label} <span className="text-gray-600">{n}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista + leitura */}
      <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(340px,440px)_1fr]">
        <div ref={listRef} tabIndex={0} onKeyDown={onListKey} title={lw.keys}
          className="overflow-y-auto custom-scrollbar border-r border-tactical-900 outline-none">
          {events.length === 0
            ? <div className="p-10 text-center text-gray-600 text-xs">{lw.waiting}</div>
            : visible.length === 0
              ? <div className="p-10 text-center text-gray-600 text-xs">{lw.empty}</div>
              : rows}
        </div>
        <div className="hidden lg:block overflow-y-auto custom-scrollbar">
          {detail ?? <div className="p-10 text-center text-gray-600 text-xs">{lw.select}</div>}
        </div>
      </div>

      {/* Leitura em tela cheia no celular */}
      {mobileOpen && selected && (
        <div className="lg:hidden fixed inset-0 top-11 bottom-9 z-30 bg-[#050505] overflow-y-auto">{detail}</div>
      )}
    </div>
  );
};

export default IntelFeed;
