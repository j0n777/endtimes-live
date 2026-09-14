import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Book, AlertTriangle, Radio, Star, ChevronRight } from 'lucide-react';
import { useLocale } from '../lib/i18n';
import { MOCK_EVENTS, SURVIVAL_GUIDES, RADIO_CHANNELS, PROPHECY_EVENTS } from '../constants';
import { ViewState, MonitorEvent } from '../types';
export const normalizeForSearch = (str: string | undefined | null) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

interface SearchResult {
  id: string;
  type: 'EVENT' | 'PROTOCOL' | 'RADIO' | 'PROPHECY';
  title: string;
  description?: string;
  category?: string;
  targetTab: ViewState;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ViewState, id?: string) => void;
  events?: MonitorEvent[];
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate, events = [] }) => {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = normalizeForSearch(query);
    const searchResults: SearchResult[] = [];

    // Search Protocols
    SURVIVAL_GUIDES.forEach(g => {
      if (normalizeForSearch(g.title).includes(q) || normalizeForSearch(g.content).includes(q)) {
        searchResults.push({
          id: g.id,
          type: 'PROTOCOL',
          title: g.title,
          description: g.category,
          targetTab: 'SURVIVAL'
        });
      }
    });

    // Search Events (Live + Mock)
    const allEvents = [...MOCK_EVENTS, ...events];
    // Deduplicate by ID
    const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values());

    uniqueEvents.forEach(e => {
      if (normalizeForSearch(e.title).includes(q) || normalizeForSearch(e.description).includes(q) || normalizeForSearch(e.location).includes(q)) {
        searchResults.push({
          id: e.id,
          type: 'EVENT',
          title: e.title,
          description: e.location,
          targetTab: 'SITUATION_MAP'
        });
      }
    });

    // Search Radio
    RADIO_CHANNELS.forEach(r => {
      if (normalizeForSearch(r.name).includes(q) || normalizeForSearch(r.frequency).includes(q) || normalizeForSearch(r.description).includes(q)) {
        searchResults.push({
          id: r.id,
          type: 'RADIO',
          title: r.name,
          description: r.frequency,
          targetTab: 'RADIO'
        });
      }
    });

    // Search Prophecies
    PROPHECY_EVENTS.forEach(p => {
      if (normalizeForSearch(p.title).includes(q) || normalizeForSearch(p.scripture).includes(q)) {
        searchResults.push({
          id: p.id,
          type: 'PROPHECY',
          title: p.title,
          description: p.scripture,
          targetTab: 'TIMELINE'
        });
      }
    });

    setResults(searchResults.slice(0, 10)); // Limit to 10 results
    setSelectedIndex(0);
  }, [query, events]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      const result = results[selectedIndex];
      onNavigate(result.targetTab, result.id);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/60">
      <div 
        className="w-full max-w-2xl bg-[#0a0a0b] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <div className="relative flex items-center p-4 border-b border-white/5">
          <Search className="w-5 h-5 text-white/40 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-white/20"
            placeholder={locale === 'pt-BR' ? 'Buscar protocolos, eventos, rádios...' : 'Search protocols, events, radio...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                  onClick={() => {
                    onNavigate(result.targetTab, result.id);
                    onClose();
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                    result.type === 'PROTOCOL' ? 'bg-blue-500/20 text-blue-400' :
                    result.type === 'EVENT' ? 'bg-red-500/20 text-red-400' :
                    result.type === 'RADIO' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {result.type === 'PROTOCOL' && <Book className="w-4 h-4" />}
                    {result.type === 'EVENT' && <AlertTriangle className="w-4 h-4" />}
                    {result.type === 'RADIO' && <Radio className="w-4 h-4" />}
                    {result.type === 'PROPHECY' && <Star className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{result.title}</div>
                    <div className="text-xs text-white/40 truncate">{result.description}</div>
                  </div>
                  {index === selectedIndex && (
                    <div className="text-[10px] text-white/20 font-mono flex items-center">
                      ENTER <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-white/40">
              {locale === 'pt-BR' ? 'Nenhum resultado encontrado.' : 'No results found.'}
            </div>
          ) : (
            <div className="p-6">
              <div className="text-[10px] uppercase tracking-widest text-white/20 mb-4 font-bold">
                {locale === 'pt-BR' ? 'Sugestões de Busca' : 'Search Suggestions'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['Água', 'Defcon', 'Radio', 'Gog'].map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="flex items-center p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all text-sm text-white/60"
                  >
                    <Search className="w-3 h-3 mr-2 opacity-40" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-white/[0.02] border-t border-white/5 flex justify-between items-center text-[10px] text-white/20 font-mono">
          <div className="flex gap-4">
            <span>↑↓ Para navegar</span>
            <span>ENTER Para selecionar</span>
          </div>
          <div className="flex items-center">
            <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 mr-1">ESC</span> fechar
          </div>
        </div>
      </div>
    </div>
  );
};
