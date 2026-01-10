import React from 'react';
import { RADIO_CHANNELS } from '../constants';
import { Radio, Signal, Info } from 'lucide-react';

const CommsPanel: React.FC = () => {
  return (
    <div className="h-full bg-[#050505] text-gray-200 font-mono p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-tactical-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-tactical-800 rounded text-amber-500">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-widest">SIGNAL INTELLIGENCE</h1>
              <div className="text-xs text-gray-500">GLOBAL FREQUENCY DATABASE</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-tactical-500 bg-tactical-900 px-3 py-1 rounded border border-tactical-700">
            <Signal className="w-4 h-4 animate-pulse" />
            <span>SCANNING...</span>
          </div>
        </div>

        {/* Bands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {['HF', 'VHF', 'UHF'].map(band => (
            <div key={band} className="bg-tactical-900 border border-tactical-800 p-4 rounded">
              <div className="text-3xl font-bold text-tactical-800 select-none absolute right-4 top-4 opacity-20">{band}</div>
              <h3 className="text-tactical-500 font-bold text-lg mb-2">{band} BAND</h3>
              <p className="text-xs text-gray-500 mb-4">
                {band === 'HF' ? 'Long Range / Global (Ionosphere)' :
                  band === 'VHF' ? 'Regional / Line of Sight + Refract' :
                    'Short Range / Urban Penetration'}
              </p>
              <div className="text-4xl font-mono text-white opacity-80">
                {RADIO_CHANNELS.filter(c => c.band === band).length} <span className="text-xs text-gray-600">CHANNELS</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Table */}
        <div className="bg-tactical-900 border border-tactical-700 rounded overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black text-xs text-gray-500 border-b border-tactical-700 uppercase tracking-wider">
                <th className="p-4 w-24">Band</th>
                <th className="p-4 w-32">Freq</th>
                <th className="p-4 w-24">Mode</th>
                <th className="p-4">Designation</th>
                <th className="p-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tactical-800">
              {RADIO_CHANNELS.map(ch => (
                <tr key={ch.id} className="hover:bg-tactical-800/50 transition-colors">
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${ch.band === 'HF' ? 'bg-blue-900/30 text-blue-400' :
                        ch.band === 'VHF' ? 'bg-[#c19a6b]/30 text-[#c19a6b]' :
                          'bg-purple-900/30 text-purple-400'
                      }`}>
                      {ch.band}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-amber-500 font-bold">{ch.frequency}</td>
                  <td className="p-4 text-xs text-gray-400">{ch.mode}</td>
                  <td className="p-4 font-bold text-white">{ch.name}</td>
                  <td className="p-4 text-sm text-gray-400 flex items-center gap-2">
                    <Info className="w-3 h-3 text-gray-600" />
                    {ch.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 border border-tactical-700 border-dashed rounded text-xs text-gray-500 flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5" />
          <p>
            WARNING: Transmitting on these frequencies requires appropriate licensing (Amateur Radio / GMRS / Marine) except in situations involving immediate threat to life or property where no other means of communication is available. Listen first.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommsPanel;
