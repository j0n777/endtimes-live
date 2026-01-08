import React, { useState } from 'react';
import { SURVIVAL_GUIDES } from '../constants';
import { SurvivalGuide } from '../types';
import { ChevronRight, CheckSquare, Square, Droplets, Utensils, Shield, Radio, Flame, Zap } from 'lucide-react';

const SurvivalManual: React.FC = () => {
  const [selectedGuide, setSelectedGuide] = useState<SurvivalGuide>(SURVIVAL_GUIDES[0]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

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

  return (
    <div className="flex h-full bg-[#050505] text-gray-200 font-mono">
      {/* Sidebar List */}
      <div className="w-64 border-r border-tactical-800 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-tactical-800 bg-tactical-900">
          <h2 className="text-tactical-500 font-bold tracking-widest">PROTOCOLS</h2>
        </div>
        {SURVIVAL_GUIDES.map(guide => (
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
             {selectedGuide.content.split('\n').map((line, i) => {
                if (line.startsWith('###')) {
                  return <h3 key={i} className="text-lg font-mono font-bold text-tactical-500 mt-6 mb-3 border-l-4 border-tactical-500 pl-3">{line.replace('###', '')}</h3>;
                }
                if (line.startsWith('-')) {
                  return (
                    <div key={i} className="flex gap-2 mb-2 ml-4">
                      <span className="text-tactical-500">•</span>
                      <span className="text-gray-300">{line.replace('-', '')}</span>
                    </div>
                  );
                }
                if (line.startsWith('**')) {
                   // Simple bold parser
                   return <p key={i} className="mb-4 text-gray-300 font-bold">{line.replace(/\*\*/g, '')}</p>
                }
                return <p key={i} className="mb-4 text-gray-300 leading-relaxed">{line}</p>;
             })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurvivalManual;
