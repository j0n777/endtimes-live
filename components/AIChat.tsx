import React, { useState } from 'react';
import { analyzeSituation } from '../services/geminiService';
import { MonitorEvent } from '../types';
import { MessageSquare, Cpu, Loader, Send } from 'lucide-react';

interface AIChatProps {
  events: MonitorEvent[];
}

const AIChat: React.FC<AIChatProps> = ({ events }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const result = await analyzeSituation(events, query);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-tactical-900 border border-tactical-500/30 rounded-lg overflow-hidden">
      <div className="bg-tactical-800 p-3 border-b border-tactical-500/30 flex items-center gap-2">
        <Cpu className="text-tactical-500 w-5 h-5" />
        <h3 className="font-mono text-tactical-500 font-bold">INTELLIGENCE_CORE_V3 (GEMINI)</h3>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-sm">
        <div className="bg-tactical-800/50 p-3 rounded border-l-2 border-tactical-500">
          <p className="text-gray-400">System online. Uplink established. Ready for eschatological analysis queries.</p>
        </div>

        {response && (
          <div className="bg-tactical-800 p-4 rounded border border-tactical-500/50">
            <div className="flex items-center gap-2 mb-2 text-tactical-500">
              <Cpu className="w-4 h-4" />
              <span className="text-xs font-bold">ANALYSIS_RESULT</span>
            </div>
            <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{response}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-tactical-500 animate-pulse">
            <Loader className="w-4 h-4 animate-spin" />
            <span>PROCESSING INTEL...</span>
          </div>
        )}
      </div>

      <div className="p-3 bg-tactical-800 border-t border-tactical-500/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalysis()}
            placeholder="Enter query (e.g., 'Implications of Israel border conflict?')"
            className="flex-1 bg-black border border-gray-700 text-[#c19a6b] p-2 font-mono text-sm focus:outline-none focus:border-tactical-500 placeholder-gray-700"
          />
          <button
            onClick={handleAnalysis}
            disabled={loading}
            className="bg-tactical-500 hover:bg-[#9d7e4f] text-black px-4 py-2 font-bold font-mono transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
