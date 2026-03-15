import React, { useState } from 'react';
import { SURVIVAL_GUIDES } from '../constants';
import { SURVIVAL_GUIDES_PT } from '../locales/content.pt-BR';
import { SurvivalGuide } from '../types';
import { ChevronRight, CheckSquare, Square, Droplets, Utensils, Shield, Radio, Flame, Zap } from 'lucide-react';
import { useLocale } from '../lib/i18n';

/** Renders inline **bold** and *italic* within a text string as React nodes. */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/** Minimal markdown renderer: headings, bullet/numbered lists, bold inline. */
const MarkdownContent: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${listKey++}`} className="mb-4 space-y-1 ml-4">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-sm font-mono font-bold text-tactical-500 mt-6 mb-2 border-l-4 border-tactical-500 pl-3 uppercase tracking-widest">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-base font-mono font-bold text-white mt-5 mb-2">{line.slice(3)}</h2>
      );
    } else if (/^(\d+)\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '');
      listItems.push(
        <li key={i} className="flex gap-2 text-gray-300 text-sm">
          <span className="text-tactical-500 shrink-0">{line.match(/^(\d+)/)?.[1]}.</span>
          <span>{renderInline(content)}</span>
        </li>
      );
    } else if (line.startsWith('- ')) {
      listItems.push(
        <li key={i} className="flex gap-2 text-gray-300 text-sm">
          <span className="text-tactical-500 shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </li>
      );
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={i} className="mb-3 text-gray-300 text-sm leading-relaxed">{renderInline(line)}</p>
      );
    }
  });
  flushList();
  return <>{elements}</>;
};

const SurvivalManual: React.FC = () => {
  const { t, locale } = useLocale();
  const guides = locale === 'pt-BR' ? SURVIVAL_GUIDES_PT : SURVIVAL_GUIDES;
  const [selectedGuide, setSelectedGuide] = useState<SurvivalGuide>(guides[0]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Reset selected guide when locale changes
  React.useEffect(() => {
    setSelectedGuide(guides[0]);
  }, [locale]);

  // Deep Link Support
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const guideId = params.get('guide');
    if (guideId) {
      const targetGuide = guides.find(g => g.id === guideId);
      if (targetGuide) setSelectedGuide(targetGuide);
    }
  }, []);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'WATER': return <Droplets className="w-4 h-4" />;
      case 'FOOD': return <Utensils className="w-4 h-4" />;
      case 'SECURITY': return <Shield className="w-4 h-4" />;
      case 'COMMS': return <Radio className="w-4 h-4" />;
      case 'ENERGY': return <Zap className="w-4 h-4" />;
      default: return <Flame className="w-4 h-4" />;
    }
  };

  const survivalSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `Survival Protocol: ${selectedGuide.title}`,
    "description": selectedGuide.content.substring(0, 150).replace(/[#*]/g, '') + '...',
    "step": selectedGuide.checklist ? selectedGuide.checklist.map(item => ({
      "@type": "HowToStep",
      "text": item.text
    })) : [],
    "image": "https://endtimes.live/logo_etm.jpg"
  };

  return (
    <div className="flex h-full bg-[#050505] text-gray-200 font-mono">
      <SEOHead
        title={`Survival Protocol: ${selectedGuide.title}`}
        description={`Emergency preparedness guide for ${selectedGuide.category}. ${selectedGuide.content.substring(0, 100).replace(/[#*]/g, '')}...`}
        schema={survivalSchema}
        type="article"
      />
      {/* Sidebar List */}
      <div className="w-64 border-r border-tactical-800 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-tactical-800 bg-tactical-900">
          <h2 className="text-tactical-500 font-bold tracking-widest">{t.protocols.title}</h2>
        </div>
        {guides.map(guide => (
          <button
            key={guide.id}
            onClick={() => setSelectedGuide(guide)}
            className={`flex items-center gap-3 p-4 text-left border-b border-tactical-800 transition-colors ${selectedGuide.id === guide.id ? 'bg-tactical-800/50 text-white' : 'hover:bg-tactical-800/20 text-gray-400'}`}
          >
            <span className={`p-2 rounded bg-tactical-900 ${selectedGuide.id === guide.id ? 'text-tactical-500' : 'text-gray-600'}`}>
              {getIcon(guide.category)}
            </span>
            <div className="flex-1">
              <div className="font-bold text-sm">{guide.title}</div>
              <div className="text-[10px] opacity-60">{guide.category}</div>
            </div>
            {selectedGuide.id === guide.id && <ChevronRight className="w-4 h-4 text-tactical-500" />}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-tactical-700">
            <div className="p-3 bg-tactical-800 rounded text-tactical-500">
              {getIcon(selectedGuide.category)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wider">{selectedGuide.title}</h1>
              <span className="text-xs text-tactical-500 bg-tactical-900 px-2 py-1 rounded border border-tactical-700">
                PROTOCOL: {selectedGuide.category}_V1
              </span>
            </div>
          </div>

          {/* Checklist Section */}
          {selectedGuide.checklist && (
            <div className="mb-8 bg-tactical-900/50 border border-tactical-700 rounded p-4">
              <h3 className="text-sm font-bold text-tactical-warn mb-3 uppercase tracking-widest">Readiness Checklist</h3>
              <div className="space-y-2">
                {selectedGuide.checklist.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className="flex items-center gap-3 cursor-pointer group hover:bg-tactical-800/50 p-1 rounded"
                  >
                    {checkedItems[item.id] ?
                      <CheckSquare className="w-5 h-5 text-tactical-500" /> :
                      <Square className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                    }
                    <span className={`text-sm ${checkedItems[item.id] ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose prose-invert prose-sm max-w-none font-sans">
            <MarkdownContent text={selectedGuide.content} />
          </div>
        </div>
      </div>
    </div>
  );
};

import { SEOHead } from './SEOHead';

export default SurvivalManual;
