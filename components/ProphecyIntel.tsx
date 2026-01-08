import React from 'react';
import { PROPHECY_EVENTS } from '../constants';
import { BookOpen, CheckCircle, Clock, CircleDashed } from 'lucide-react';

const ProphecyIntel: React.FC = () => {
  return (
    <div className="h-full bg-[#050505] text-gray-200 font-mono p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-tactical-700 pb-4">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-tactical-800 rounded text-tactical-alert">
               <BookOpen className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-white tracking-widest">PROPHETIC TIMELINE</h1>
               <div className="text-xs text-gray-500">ESCHATOLOGICAL EVENT TRACKING</div>
             </div>
           </div>
           
           <div className="text-right hidden md:block">
             <div className="text-3xl font-bold text-tactical-alert">MIDNIGHT</div>
             <div className="text-[10px] text-gray-500 tracking-widest">WATCH HOUR</div>
           </div>
        </div>

        <div className="relative border-l-2 border-tactical-800 ml-4 md:ml-8 space-y-8 py-4">
          {PROPHECY_EVENTS.map((event, index) => {
             const getStatusColor = (s: string) => {
               if (s === 'FULFILLED') return 'text-tactical-500 border-tactical-500';
               if (s === 'IN_PROGRESS') return 'text-tactical-warn border-tactical-warn';
               return 'text-gray-600 border-gray-600';
             };
             
             const getIcon = (s: string) => {
               if (s === 'FULFILLED') return <CheckCircle className="w-5 h-5" />;
               if (s === 'IN_PROGRESS') return <Clock className="w-5 h-5" />;
               return <CircleDashed className="w-5 h-5" />;
             };

             return (
               <div key={event.id} className="relative pl-8 md:pl-12">
                 {/* Node on timeline */}
                 <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#050505] border-2 ${getStatusColor(event.status)} flex items-center justify-center`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${event.status === 'PENDING' ? 'bg-transparent' : 'bg-current'}`}></div>
                 </div>

                 {/* Content Card */}
                 <div className={`bg-tactical-900 border border-tactical-800 p-5 rounded hover:border-tactical-700 transition-colors group`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded bg-black/50 ${getStatusColor(event.status)}`}>
                          {getIcon(event.status)}
                        </span>
                        <h3 className="text-lg font-bold text-gray-100">{event.title}</h3>
                      </div>
                      <span className="text-xs font-mono px-2 py-1 rounded bg-black text-gray-500 border border-tactical-800">
                        {event.scripture}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-600 uppercase tracking-wider">
                       <span>STATUS: {event.status.replace('_', ' ')}</span>
                       {event.status === 'IN_PROGRESS' && (
                         <span className="text-tactical-warn animate-pulse">ACTIVE MONITORING</span>
                       )}
                    </div>
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProphecyIntel;
