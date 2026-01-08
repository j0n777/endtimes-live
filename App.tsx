import React, { useState, useEffect } from 'react';
import { AlertTriangle, Radio, BookOpen, Activity, RefreshCw, Layers, Shield, Menu, X, Globe, DollarSign, Cpu, LandPlot, Rss, Settings } from 'lucide-react';
import { MOCK_EVENTS } from './constants';
import { ViewState, MonitorEvent, AdminConfig } from './types';
import SituationMap from './components/SituationMap';
import AIChat from './components/AIChat';
import TacticalRadar from './components/TacticalRadar';
import SurvivalManual from './components/SurvivalManual';
import CommsPanel from './components/CommsPanel';
import ProphecyIntel from './components/ProphecyIntel';
import IntelFeed from './components/IntelFeed';
import AdminPanel from './components/AdminPanel';
import { fetchRealTimeEvents } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('SITUATION_MAP');
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize with persisted data
  useEffect(() => {
    const savedEvents = localStorage.getItem('monitor_events');
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        if (parsed.length > 0) {
          setEvents(parsed);
        } else {
          setEvents(MOCK_EVENTS);
        }
      } catch (e) {
        setEvents(MOCK_EVENTS);
      }
    } else {
      setEvents(MOCK_EVENTS);
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stats for the footer
  const stats = {
    conflict: events.filter(e => e.category === 'CONFLICT').length,
    tech: events.filter(e => e.category === 'TECHNOLOGY').length,
    finance: events.filter(e => e.category === 'ECONOMIC').length,
    gov: events.filter(e => e.category === 'GOVERNMENT').length,
  };

  const handleRefreshData = async () => {
    setLoading(true);
    
    // Load config for custom channels
    let customChannels: string[] = [];
    const savedConfig = localStorage.getItem('admin_config');
    if (savedConfig) {
      try {
        const config: AdminConfig = JSON.parse(savedConfig);
        customChannels = config.customChannels || [];
      } catch (e) {
        console.error("Config load error", e);
      }
    }

    const realEvents = await fetchRealTimeEvents(customChannels);
    
    // Smart merge: Add new events, keep old ones if they are recent (avoid full wipe)
    // For simplicity in this demo, we combine mock + new
    let updatedEvents = [...realEvents];
    if (updatedEvents.length === 0) updatedEvents = MOCK_EVENTS; // Fallback

    setEvents(updatedEvents);
    
    // Persist to LocalStorage (Pseudo-Database)
    localStorage.setItem('monitor_events', JSON.stringify(updatedEvents));
    
    setLoading(false);
  };

  const NavButton = ({ target, label, icon: Icon }: { target: ViewState, label: string, icon?: any }) => (
    <button 
      onClick={() => { setView(target); setMobileMenuOpen(false); }} 
      className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-2
        ${view === target ? 'bg-tactical-800 text-tactical-500' : 'text-gray-400 hover:text-white'}`}
    >
      {Icon && <Icon className="w-4 h-4 md:hidden" />}
      {label}
    </button>
  );

  const renderContent = () => {
    switch(view) {
      case 'SURVIVAL': return <SurvivalManual />;
      case 'RADIO': return <CommsPanel />;
      case 'TIMELINE': return <ProphecyIntel />;
      case 'LIVE_FEED': return <IntelFeed events={events} />;
      case 'ADMIN': return <AdminPanel />;
      case 'SITUATION_MAP': 
      default: 
        return (
          <div className="w-full h-full relative">
            <SituationMap events={events} />
            {/* Floating Overlay Stats (Desktop Only) */}
            <div className="absolute top-4 left-4 z-10 hidden md:block w-72 pointer-events-none">
              <div className="bg-tactical-900/90 border border-tactical-700 p-2 backdrop-blur-sm pointer-events-auto">
                <div className="text-[10px] text-tactical-500 uppercase mb-1 border-b border-tactical-700 pb-1 flex justify-between">
                  <span>Priority Threats</span>
                  <span className="animate-pulse text-red-500">LIVE</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {events.filter(e => e.severity === 'HIGH' || e.severity === 'ELEVATED').slice(0, 5).map(e => (
                    <div key={e.id} className="flex justify-between items-center text-xs border-b border-gray-800 pb-1 mb-1">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[180px] text-gray-300 font-bold">{e.title}</span>
                        <span className="text-[9px] text-gray-500">{e.sourceName}</span>
                      </div>
                      <span className={`${e.severity === 'HIGH' ? 'text-red-500' : 'text-orange-500'} font-bold`}>
                        {e.conflictLevel?.replace('_', ' ') || e.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-gray-200 flex flex-col overflow-hidden font-mono relative">
      
      {/* Header */}
      <header className="h-14 bg-tactical-900 border-b border-tactical-700 flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div 
            className="flex items-center gap-2 text-white cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setView('SITUATION_MAP')}
          >
            <Shield className="w-5 h-5 text-tactical-alert" />
            <div className="flex flex-col leading-none">
               <h1 className="text-lg font-bold tracking-[0.1em] text-white whitespace-nowrap">ET MONITOR</h1>
               <span className="text-[8px] text-tactical-alert tracking-widest hidden sm:block">SYSTEM: APOCALYPSE_READY</span>
            </div>
          </div>
        </div>

        {/* Main Nav (Desktop) */}
        <div className="hidden md:flex items-center gap-1">
           <NavButton target="SITUATION_MAP" label="SITUATION" />
           <NavButton target="LIVE_FEED" label="LIVE WIRE" />
           <NavButton target="TIMELINE" label="PROPHECY" />
           <NavButton target="SURVIVAL" label="PROTOCOLS" />
           <NavButton target="RADIO" label="COMMS" />
           <NavButton target="ADMIN" label="ADMIN" />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-3 py-1 bg-tactical-800 border border-tactical-700 hover:bg-tactical-700 text-xs text-white transition-colors"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">INTEL</span>
          </button>
          <button 
            onClick={handleRefreshData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 bg-white text-black font-bold text-xs hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'SYNC' : 'REFRESH'}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 w-full bg-tactical-900 border-b border-tactical-700 z-50 md:hidden flex flex-col p-4 space-y-2 shadow-2xl">
           <NavButton target="SITUATION_MAP" label="SITUATION MAP" icon={Globe} />
           <NavButton target="LIVE_FEED" label="LIVE INTELLIGENCE WIRE" icon={Rss} />
           <NavButton target="TIMELINE" label="PROPHETIC TIMELINE" icon={BookOpen} />
           <NavButton target="SURVIVAL" label="SURVIVAL PROTOCOLS" icon={Shield} />
           <NavButton target="RADIO" label="RADIO / COMMS" icon={Radio} />
           <NavButton target="ADMIN" label="ADMINISTRATION" icon={Settings} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative bg-[#050505] overflow-hidden">
        {renderContent()}

        {/* Right Sidebar (Sliding Panel) */}
        <div className={`absolute top-0 right-0 h-full w-80 sm:w-96 bg-tactical-900/95 border-l border-tactical-700 transform transition-transform duration-300 z-30 backdrop-blur-md flex flex-col ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className="p-4 border-b border-tactical-700 flex justify-between items-center bg-black/40">
             <h2 className="text-sm font-bold tracking-widest text-white">INTELLIGENCE_LAYER</h2>
             <button onClick={() => setSidebarOpen(false)}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Radar Widget */}
              <div>
                <h3 className="text-xs text-tactical-500 mb-2 flex items-center gap-2"><Activity className="w-3 h-3"/> THREAT RADAR</h3>
                <TacticalRadar events={events} />
              </div>

              {/* AI Chat Widget */}
              <div className="h-80">
                 <h3 className="text-xs text-tactical-500 mb-2 flex items-center gap-2"><Cpu className="w-3 h-3"/> AI TACTICAL ADVISOR</h3>
                 <AIChat events={events} />
              </div>
           </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-0 left-0 w-full h-10 bg-tactical-900 border-t border-tactical-700 flex items-center text-xs font-mono z-20 overflow-x-auto">
           <div className="flex-1 h-full flex items-center justify-center border-r border-tactical-700 gap-2 px-2 whitespace-nowrap">
             <Globe className="w-3 h-3 text-gray-500" />
             <span className="text-gray-400 hidden sm:inline">WORLD</span>
             <span className="text-tactical-500 font-bold ml-1">{stats.conflict}</span>
           </div>
           <div className="flex-1 h-full flex items-center justify-center border-r border-tactical-700 gap-2 px-2 whitespace-nowrap">
             <Cpu className="w-3 h-3 text-gray-500" />
             <span className="text-gray-400 hidden sm:inline">TECH</span>
             <span className="text-tactical-500 font-bold ml-1">{stats.tech}</span>
           </div>
           <div className="flex-1 h-full flex items-center justify-center border-r border-tactical-700 gap-2 px-2 whitespace-nowrap">
             <DollarSign className="w-3 h-3 text-gray-500" />
             <span className="text-gray-400 hidden sm:inline">FINANCE</span>
             <span className="text-tactical-500 font-bold ml-1">{stats.finance}</span>
           </div>
           <div className="flex-1 h-full flex items-center justify-center gap-2 px-2 whitespace-nowrap">
             <LandPlot className="w-3 h-3 text-gray-500" />
             <span className="text-gray-400 hidden sm:inline">GOV</span>
             <span className="text-tactical-500 font-bold ml-1">{stats.gov}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;