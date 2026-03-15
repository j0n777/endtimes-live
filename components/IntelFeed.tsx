import React from 'react';
import { MonitorEvent, ConflictLevel, SourceType } from '../types';
import { Radio, Rss, Twitter, Database, AlertCircle, ExternalLink } from 'lucide-react';

interface IntelFeedProps {
  events: MonitorEvent[];
}

const IntelFeed: React.FC<IntelFeedProps> = ({ events }) => {

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case SourceType.RSS:           return <Rss       className="w-3 h-3" />;
      case SourceType.TWITTER_OSINT: return <Twitter   className="w-3 h-3" />;
      case SourceType.TELEGRAM:      return <Radio     className="w-3 h-3" />;
      case SourceType.OFFICIAL:      return <Database  className="w-3 h-3" />;
      default:                       return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getSeverityAccent = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-l-2 border-red-600/70';
      case 'HIGH':     return 'border-l-2 border-orange-600/50';
      case 'ELEVATED': return 'border-l-2 border-yellow-700/40';
      default:         return 'border-l-2 border-transparent';
    }
  };

  return (
    <div className="h-full bg-[#050505] text-gray-200 font-mono flex flex-col">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-tactical-800 bg-tactical-900 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-gray-300 font-bold tracking-widest text-sm">
            <span className="text-tactical-500">●</span> LIVE INTELLIGENCE WIRE
          </h2>
          <div className="text-[10px] text-gray-600 mt-0.5">RAW DATA STREAM // {events.length} ITEMS</div>
        </div>
        <div className="flex gap-3 text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><Rss      className="w-3 h-3" /> RSS</span>
          <span className="flex items-center gap-1"><Twitter  className="w-3 h-3" /> X</span>
          <span className="flex items-center gap-1"><Radio    className="w-3 h-3" /> TG</span>
        </div>
      </div>

      {/* ── Events grid ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {events.length === 0 ? (
          <div className="p-10 text-center text-gray-700 text-xs tracking-widest">
            AWAITING UPLINK...<br />SYNCING WITH OSINT AGGREGATORS...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
            {events.map((event) => (
              <div
                key={event.id}
                className={`group p-3 bg-black/30 border border-tactical-800/40 hover:bg-white/5 hover:border-tactical-700/50 transition-all duration-150 ${getSeverityAccent(event.severity)}`}
              >
                {/* Timestamp + category */}
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-[10px] text-gray-600 font-mono">
                    [{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${event.severity === 'CRITICAL' || event.severity === 'HIGH' ? 'text-orange-500/80' : 'text-gray-500'}`}>
                    {event.category || 'INTEL'}
                  </span>
                </div>

                {/* Title */}
                <div className="text-sm text-gray-300 font-medium leading-snug mb-2 group-hover:text-white transition-colors">
                  {event.title}
                </div>

                {/* Media */}
                {event.mediaUrl && (
                  <div className="mb-2 overflow-hidden border border-tactical-800/50 bg-black">
                    {event.mediaType === 'video' ? (
                      <video
                        src={event.mediaUrl}
                        controls
                        className="w-full max-h-40 object-contain"
                      />
                    ) : (
                      <img
                        src={event.mediaUrl}
                        alt=""
                        className="w-full max-h-40 object-cover hover:object-contain transition-all duration-300"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                )}

                {/* Footer: source + link */}
                <div className="flex items-center justify-between text-[10px] text-gray-600">
                  <div className="flex items-center gap-1.5">
                    {getSourceIcon(event.sourceType)}
                    <span className="uppercase truncate max-w-[120px]">{event.sourceName}</span>
                  </div>
                  {event.sourceUrl && (
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-gray-600 hover:text-tactical-500 transition-colors ml-2 shrink-0"
                      title="Open source"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelFeed;
