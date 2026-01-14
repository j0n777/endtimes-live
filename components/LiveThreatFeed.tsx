import React, { useState } from 'react';
import { MonitorEvent } from '../types';
import { getCategoryIcon } from '../utils/categoryIcons';
import { Activity, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { CATEGORY_COLORS } from '../categoryColors';

const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

interface LiveThreatFeedProps {
    events: MonitorEvent[];
}

export const LiveThreatFeed: React.FC<LiveThreatFeedProps> = ({ events }) => {
    const [isOpen, setIsOpen] = useState(true);

    // Sort by recency and severity
    const sortedEvents = [...events].sort((a, b) => {
        // High severity first? Or just pure chronological? 
        // User ref implies "Live Feed", so chronological is best, but "Priority" implies severity.
        // Mixing: High severity recent events first.
        if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
        if (b.severity === 'CRITICAL' && a.severity !== 'CRITICAL') return 1;

        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }).slice(0, 20); // Top 20

    return (
        <div className="absolute top-4 left-4 z-40 w-80 md:w-96 flex flex-col pointer-events-none font-mono">
            {/* Header */}
            <div className="bg-tactical-900/95 backdrop-blur-md border border-tactical-500/50 pointer-events-auto shadow-2xl">
                <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-tactical-800 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-tactical-500 animate-pulse" />
                        <h2 className="text-sm font-bold text-tactical-500 tracking-widest uppercase">Live Event Feed</h2>
                    </div>
                    <span className="text-[10px] text-tactical-500/70 uppercase font-medium">
                        [{isOpen ? '-' : '+'}]
                    </span>
                </div>
            </div>

            {/* List */}
            {isOpen && (
                <div className="bg-tactical-900/95 backdrop-blur-md border-x border-b border-tactical-500/50 max-h-[60vh] overflow-y-auto custom-scrollbar pointer-events-auto shadow-2xl">
                    <div className="flex flex-col">
                        {sortedEvents.map((event, index) => {
                            const Icon = getCategoryIcon(event.category);
                            const color = CATEGORY_COLORS[event.category] || '#c19a6b';
                            const timeAgo = formatTimeAgo(new Date(event.timestamp));

                            return (
                                <div key={event.id} className="p-3 border-b border-tactical-700/50 hover:bg-tactical-800/50 transition-colors group">
                                    {/* Row 1: Icon + Title */}
                                    <div className="flex items-start gap-3 mb-1">
                                        <div className="mt-1 shrink-0 relative">
                                            <Icon className="w-4 h-4" style={{ color: color }} />
                                            {event.severity === 'CRITICAL' && (
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-none animate-ping" />
                                            )}
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-300 leading-tight group-hover:text-tactical-500 transition-colors font-mono">
                                            {event.title.toUpperCase()}
                                        </h3>
                                    </div>

                                    {/* Row 2: Location + Metadata */}
                                    <div className="flex items-center gap-4 pl-7 mb-2">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-wider">
                                            <MapPin className="w-3 h-3 text-tactical-500/70" />
                                            <span className="truncate max-w-[150px]">{event.location || 'UNKNOWN SECTOR'}</span>
                                        </div>

                                        {/* Verified Badge */}
                                        {(event.sourceType !== 'RSS' && event.sourceType !== 'SOCIAL') && (
                                            <div className="flex items-center gap-1 text-[10px] text-tactical-500" title="Verified Source">
                                                <ShieldCheck className="w-3 h-3" />
                                                <span>VERIFIED</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Row 3: Badges */}
                                    <div className="flex items-center gap-2 pl-7">
                                        <span
                                            className={`px-1 py-0.5 text-[9px] font-bold uppercase tracking-widest border
                                                ${event.severity === 'CRITICAL' ? 'bg-red-900/20 text-red-500 border-red-500' :
                                                    event.severity === 'HIGH' ? 'bg-orange-900/20 text-orange-500 border-orange-500' :
                                                        'bg-gray-800 text-gray-400 border-gray-600'}`}
                                        >
                                            {event.severity}
                                        </span>
                                        <span className="flex items-center gap-1 text-[9px] text-gray-500 font-mono">
                                            <Clock className="w-3 h-3" />
                                            {timeAgo}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {sortedEvents.length === 0 && (
                            <div className="p-8 text-center text-tactical-500/50 text-xs font-mono tracking-widest uppercase">
                                No active threats detected in this sector.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
