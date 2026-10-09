import React from 'react';
import { BookOpen, Radio } from 'lucide-react';
import { useLocale } from '../lib/i18n';
import SurvivalManual from './SurvivalManual';
import CommsPanel from './CommsPanel';

// Protocolos (09/10/2026): os guias de sobrevivência e o rádio, que antes era uma aba
// própria no menu de cima, ficam juntos aqui em duas seções bem distintas.
export type ProtocolsSection = 'guides' | 'radio';

export const ProtocolsView: React.FC<{ section: ProtocolsSection; onSection: (s: ProtocolsSection) => void }> = ({ section, onSection }) => {
  const { t } = useLocale();
  const tab = (id: ProtocolsSection, label: string, Icon: React.ElementType) => (
    <button
      role="tab"
      aria-selected={section === id}
      onClick={() => onSection(id)}
      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-widest border-b-2 transition-colors ${
        section === id ? 'border-tactical-500 text-tactical-400' : 'border-transparent text-gray-500 hover:text-gray-300'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      <div className="flex border-b border-tactical-800 bg-tactical-900/60 shrink-0" role="tablist">
        {tab('guides', t.protocols.guidesTab, BookOpen)}
        {tab('radio', t.protocols.radioTab, Radio)}
      </div>
      <div className="flex-1 min-h-0">
        {section === 'guides' ? <SurvivalManual /> : (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto px-6 pt-6">
              <div className="border border-amber-700/40 bg-amber-950/20 rounded p-4 font-mono text-xs text-gray-300 leading-relaxed">
                <div className="text-amber-400 font-bold tracking-widest mb-2">{t.protocols.radioLicenseTitle}</div>
                <ul className="list-disc pl-4 space-y-1">
                  {t.protocols.radioLicense.map((line: string) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            </div>
            <CommsPanel />
          </div>
        )}
      </div>
    </div>
  );
};
