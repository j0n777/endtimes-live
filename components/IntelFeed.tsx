import React from 'react';
import { MonitorEvent, ConflictLevel, SourceType } from '../types';
import { Radio, Rss, Twitter, Database, AlertCircle } from 'lucide-react';

interface IntelFeedProps {
  events: MonitorEvent[];
}

const IntelFeed: React.FC<IntelFeedProps> = ({ events }) => {
  
  const getSourceIcon = (type: SourceType) => {
    switch(type) {
      case SourceType.RSS: return <Rss className="w-3 h-3" />;
      case SourceType.TWITTER_OSINT: return <Twitter className="w-3 h-3" />;
      case SourceType.TELEGRAM: return <Radio className="w-3 h-3" />;
      case SourceType.OFFICIAL: return <Database className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getLevelColor = (level?: ConflictLevel) => {
    switch(level) {
      case ConflictLevel.STATE_WAR: return 'text-red-500 border-red-900 bg-red-900/10';
      case ConflictLevel.CIVIL_WAR: return 'text-red-400 border-red-800 bg-red-900/10';
      case ConflictLevel.MILITIA_ACTION: return 'text-orange-500 border-orange-900 bg-orange-900/10';
      case ConflictLevel.MILITARY_MOVEMENT: return 'text-blue-400 border-blue-900 bg-blue-900/10';
      case ConflictLevel.POLITICAL_THREAT: return 'text-purple-400 border-purple-900 bg-purple-900/10';
      default: return 'text-gray-400 border-gray-800 bg-gray-900/10';
    }
  };

  return (
    <div className="h-full bg-[#050505] text-gray-200 font-mono flex flex-col">
      <div className="p-4 border-b border-tactical-800 bg-tactical-900 flex justify-between items-center">
        <div>
          <h2 className="text-tactical-500 font-bold tracking-widest text-sm">LIVE INTELLIGENCE WIRE</h2>
          <div className="text-[10px] text-gray-500">RAW DATA STREAM // {events.length} ITEMS</div>
        </div>
        <div className="flex gap-2 text-[10px] text-gray-600">
           <span className="flex items-center gap-1"><Rss className="w-3 h-3"/> RSS</span>
           <span className="flex items-center gap-1"><Twitter className="w-3 h-3"/> X/TWITTER</span>
           <span className="flex items-center gap-1"><Radio className="w-3 h-3"/> TELEGRAM</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {events.map((event) => (
          <div key={event.id} className={`p-3 border rounded text-xs ${getLevelColor(event.conflictLevel)} border-l-4`}>
             <div className="flex justify-between items-center mb-1">
                <span className="font-bold opacity-80">{event.conflictLevel || 'GENERAL_INTEL'}</span>
                <span className="opacity-50 text-[10px]">{new Date(event.timestamp).toLocaleTimeString()}</span>
             </div>
             
             <div className="font-bold text-gray-200 mb-1 leading-tight">{event.title}</div>
             <div className="text-gray-500 mb-2 truncate">{event.description}</div>

             <div className="flex justify-between items-center pt-2 border-t border-white/10 opacity-70">
                <div className="flex items-center gap-2">
                   {getSourceIcon(event.sourceType)}
                   <span className="uppercase">{event.sourceType}</span>
                </div>
                <div>{event.sourceName}</div>
             </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="p-8 text-center text-gray-600 text-xs">
            AWAITING UPLINK... <br/> SYNCING WITH OSINT AGGREGATORS...
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelFeed;
