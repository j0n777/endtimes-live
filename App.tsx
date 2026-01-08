import React, { useState, useEffect } from 'react';
import { AlertTriangle, Radio, BookOpen, Activity, RefreshCw, Layers, Shield, Menu, X, Globe, DollarSign, Cpu, LandPlot, Rss, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { MOCK_EVENTS } from './constants';
import { ViewState, MonitorEvent, AdminConfig, DataSourceStatus, EventCategory } from './types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from './categoryColors';
import SituationMap from './components/SituationMap';
import AIChat from './components/AIChat';
import TacticalRadar from './components/TacticalRadar';
import SurvivalManual from './components/SurvivalManual';
import CommsPanel from './components/CommsPanel';
import ProphecyIntel from './components/ProphecyIntel';
import IntelFeed from './components/IntelFeed';
import AdminPanel from './components/AdminPanel';
import { fetchRealTimeEvents } from './services/geminiService';
import { fetchAllDataSources } from './services/data-sources';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('SITUATION_MAP');
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataSourceStatuses, setDataSourceStatuses] = useState<DataSourceStatus[]>([]);
  const [priorityPanelOpen, setPriorityPanelOpen] = useState(true);
  const [legendPanelOpen, setLegendPanelOpen] = useState(true);
  const [visibleCategories, setVisibleCategories] = useState<Set<EventCategory>>(
    new Set(Object.keys(CATEGORY_COLORS) as EventCategory[])
  );

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

  // Load panel states from localStorage
  useEffect(() => {
    const savedPriorityPanelState = localStorage.getItem('priorityPanelOpen');
    const savedLegendPanelState = localStorage.getItem('legendPanelOpen');
    const savedVisibleCategories = localStorage.getItem('visibleCategories');

    if (savedPriorityPanelState) setPriorityPanelOpen(JSON.parse(savedPriorityPanelState));
    if (savedLegendPanelState) setLegendPanelOpen(JSON.parse(savedLegendPanelState));
    if (savedVisibleCategories) {
      setVisibleCategories(new Set(JSON.parse(savedVisibleCategories)));
    }
  }, []);

  // Save panel states and filters to localStorage
  useEffect(() => {
    localStorage.setItem('priorityPanelOpen', JSON.stringify(priorityPanelOpen));
    localStorage.setItem('legendPanelOpen', JSON.stringify(legendPanelOpen));
    localStorage.setItem('visibleCategories', JSON.stringify(Array.from(visibleCategories)));
  }, [priorityPanelOpen, legendPanelOpen, visibleCategories]);

  // Toggle category visibility
  const toggleCategory = (category: EventCategory) => {
    setVisibleCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Filter events by visible categories
  const filteredEvents = events.filter(e => visibleCategories.has(e.category));



  const handleRefreshData = async () => {
    setLoading(true);

    // Load config
    let config: AdminConfig | undefined;
    const savedConfig = localStorage.getItem('admin_config');
    if (savedConfig) {
      try {
        config = JSON.parse(savedConfig);
      } catch (e) {
        console.error("Config load error", e);
      }
    }

    try {
      // Fetch from all data sources (includes Telegram and  Polymarket now)
      const { events: dataSourceEvents, statuses } = await fetchAllDataSources(config);
      setDataSourceStatuses(statuses);

      // Fallback to mock if nothing loaded
      let updatedEvents = dataSourceEvents.length > 0 ? dataSourceEvents : MOCK_EVENTS;

      setEvents(updatedEvents);

      // Persist to LocalStorage
      localStorage.setItem('monitor_events', JSON.stringify(updatedEvents));

    } catch (error) {
      console.error('Data refresh error:', error);
      // Keep existing events on error
    }

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
    switch (view) {
      case 'SURVIVAL': return <SurvivalManual />;
      case 'RADIO': return <CommsPanel />;
      case 'TIMELINE': return <ProphecyIntel />;
      case 'LIVE_FEED': return <IntelFeed events={events} />;
      case 'ADMIN': return <AdminPanel />;
      case 'SITUATION_MAP':
      default:
        return (
          <div className="w-full h-full relative">
            <SituationMap events={filteredEvents} />
            {/* Priority Threats Panel - Minimizable */}
            <div className="absolute top-4 left-4 z-10 hidden md:block w-72 pointer-events-none">
              <div className="bg-tactical-900/90 border border-tactical-700 backdrop-blur-sm pointer-events-auto">
                <div className="text-[10px] text-tactical-500 uppercase p-2 pb-1 border-b border-tactical-700 flex justify-between items-center cursor-pointer"
                  onClick={() => setPriorityPanelOpen(!priorityPanelOpen)}>
                  <div className="flex items-center gap-2">
                    <span>Priority Threats</span>
                    <span className="animate-pulse text-red-500">LIVE</span>
                    <span className="text-gray-500">
                      ({filteredEvents.filter(e => e.severity === 'HIGH' || e.severity === 'ELEVATED').length})
                    </span>
                  </div>
                  {priorityPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
                {priorityPanelOpen && (
                  <div className="p-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredEvents.filter(e => e.severity === 'HIGH' || e.severity === 'ELEVATED').slice(0, 5).map(e => (
                      <div key={e.id} className="flex justify-between items-center text-xs border-b border-gray-800 pb-1 mb-1">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[180px] text-gray-300 font-bold">{e.title}</span>
                          <span className="text-[9px] text-gray-500">{e.sourceName}</span>
                        </div>
                        <span className={`${e.severity === 'HIGH' ? 'text-red-500' : 'text-orange-500'} font-bold text-[10px]`}>
                          {e.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Color Legend Panel - Minimizable */}
            <div className="absolute top-64 left-4 z-10 hidden md:block w-72 pointer-events-none">
              <div className="bg-tactical-900/90 border border-tactical-700 backdrop-blur-sm pointer-events-auto">
                <div className="text-[10px] text-tactical-500 uppercase p-2 pb-1 border-b border-tactical-700 flex justify-between items-center cursor-pointer"
                  onClick={() => setLegendPanelOpen(!legendPanelOpen)}>
                  <span>Category Filters ({visibleCategories.size}/{Object.keys(CATEGORY_COLORS).length})</span>
                  {legendPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
                {legendPanelOpen && (
                  <div className="p-2 space-y-1.5">
                    {Object.entries(CATEGORY_COLORS).map(([category, color]) => {
                      const categoryKey = category as EventCategory;
                      const count = events.filter(e => e.category === categoryKey).length;
                      const isVisible = visibleCategories.has(categoryKey);

                      return (
                        <div
                          key={category}
                          className="flex items-center gap-2 text-xs cursor-pointer hover:bg-tactical-800/50 p-1 rounded transition-colors"
                          onClick={() => toggleCategory(categoryKey)}
                        >
                          <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-all ${isVisible ? 'bg-tactical-500 border-tactical-500' : 'border-gray-600'}`}>
                            {isVisible && <span className="text-[8px] text-black font-bold">✓</span>}
                          </div>
                          <div className="w-3 h-3 rounded-full border border-black shrink-0" style={{ backgroundColor: color }}></div>
                          <span className={`flex-1 ${isVisible ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                            {CATEGORY_LABELS[categoryKey]}
                          </span>
                          <span className={`text-[10px] font-mono ${isVisible ? 'text-tactical-500' : 'text-gray-600'}`}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              <h1 className="text-lg font-bold tracking-[0.1em] text-white whitespace-nowrap">END TIMES MONITOR</h1>
              <span className="text-[8px] text-tactical-alert tracking-widest hidden sm:block">GLOBAL INTELLIGENCE PLATFORM</span>
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

        {/* Data Source Status (Desktop) */}
        {dataSourceStatuses.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-tactical-800/50 border border-tactical-700 rounded text-[10px]">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${dataSourceStatuses.some(s => s.status === 'active') ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`} />
              <span className="text-gray-400">
                {dataSourceStatuses.filter(s => s.status === 'active').length}/{dataSourceStatuses.length} SOURCES
              </span>
            </div>
            <span className="text-tactical-500 font-bold">
              {dataSourceStatuses.reduce((sum, s) => sum + (s.eventCount || 0), 0)} EVENTS
            </span>
          </div>
        )}

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
              <h3 className="text-xs text-tactical-500 mb-2 flex items-center gap-2"><Activity className="w-3 h-3" /> THREAT RADAR</h3>
              <TacticalRadar events={events} />
            </div>

            {/* AI Chat Widget */}
            <div className="h-80">
              <h3 className="text-xs text-tactical-500 mb-2 flex items-center gap-2"><Cpu className="w-3 h-3" /> AI TACTICAL ADVISOR</h3>
              <AIChat events={events} />
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default App;