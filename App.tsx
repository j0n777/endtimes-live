import React, { useState, useEffect } from 'react';
import { AlertTriangle, Radio, BookOpen, Activity, RefreshCw, Layers, Shield, Menu, X, Globe, DollarSign, Cpu, LandPlot, Rss, Settings, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { MOCK_EVENTS } from './constants';
import { ViewState, MonitorEvent, AdminConfig, DataSourceStatus, EventCategory } from './types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from './categoryColors';
import SituationMap from './components/SituationMap';
// import AIChat from './components/AIChat';
import TacticalRadar from './components/TacticalRadar';
import SurvivalManual from './components/SurvivalManual';
import CommsPanel from './components/CommsPanel';
import ProphecyIntel from './components/ProphecyIntel';
import IntelFeed from './components/IntelFeed';
import { LiveThreatFeed } from './components/LiveThreatFeed';
// import AdminPanel from './components/AdminPanel';
// REMOVED: Direct API calls - import { fetchRealTimeEvents } from './services/geminiService';
// REMOVED: Direct API calls - import { fetchAllDataSources } from './services/data-sources';
import { loadAllEvents, getCollectorStatuses, triggerDataCollection } from './services/frontendDataService';
import Clock from './components/Clock';
import { BottomFilterBar } from './components/BottomFilterBar';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('SITUATION_MAP');
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [loading, setLoading] = useState(false);
  // Disabled global clock state to prevent re-renders
  // const [currentTime, setCurrentTime] = useState(new Date());
  // Time filter state (hours) - Default 24 hours as requested
  const [timeFilter, setTimeFilter] = useState<number>(24);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataSourceStatuses, setDataSourceStatuses] = useState<DataSourceStatus[]>([]);
  const [priorityPanelOpen, setPriorityPanelOpen] = useState(true);
  const [legendPanelOpen, setLegendPanelOpen] = useState(true);
  const [visibleCategories, setVisibleCategories] = useState<Set<EventCategory>>(
    new Set(Object.keys(CATEGORY_COLORS) as EventCategory[])
  );

  // ⭐ PAGINATION: Limit threats initially, load more on demand
  const [threatsPageSize, setThreatsPageSize] = useState(10);
  const THREATS_PER_PAGE = 10;

  // Initialize by loading from Cache first, then Supabase (Stale-While-Revalidate)
  useEffect(() => {
    // Timer removed from here to prevent App re-renders. Use <Clock /> component instead.

    const loadInitialData = async () => {
      // 2. Instant Load from LocalStorage (Optimistic UI)
      const cached = localStorage.getItem('monitor_events');
      let loadedFromCache = false;

      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (Array.isArray(parsedCache) && parsedCache.length > 0) {
            console.log(`💾 Instant Load: ${parsedCache.length} events from Cache`);
            setEvents(parsedCache);
            setLoading(false); // Unblock UI immediately
            loadedFromCache = true;
          }
        } catch (e) { console.warn('Cache parse error', e); }
      }

      // 3. Fetch Fresh Data in Background
      try {
        console.log('🔄 Fetching fresh events from Supabase...');
        const supabaseEvents = await loadAllEvents();

        if (supabaseEvents.length > 0) {
          console.log(`✅ Loaded ${supabaseEvents.length} fresh events`);
          setEvents(supabaseEvents);
          localStorage.setItem('monitor_events', JSON.stringify(supabaseEvents));
        } else if (!loadedFromCache) {
          console.log('⚠️ No fresh data and no cache, using Mock');
          setEvents(MOCK_EVENTS);
        }
      } catch (error) {
        console.error('Data refresh error:', error);
        if (!loadedFromCache) setEvents(MOCK_EVENTS);
      } finally {
        setLoading(false); // Ensure loading is off
      }
    };

    loadInitialData();
    // return () => clearInterval(timer);
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

  // Filter events by visible categories and TIME
  const filteredEvents = React.useMemo(() => {
    const now = Date.now();
    const cutoff = now - (timeFilter * 3600000);

    return events.filter(e => {
      if (!visibleCategories.has(e.category)) return false;

      // Prophecy Persistence: Always show Prophetic events regardless of time filter
      if (e.category === EventCategory.PROPHETIC) return true;

      const eventTime = new Date(e.timestamp).getTime();
      return eventTime > cutoff;
    });
  }, [events, visibleCategories, timeFilter]);

  // Calculate counts for BottomBar
  const eventCounts = React.useMemo(() => {
    const counts: Record<EventCategory, number> = {} as any;
    Object.values(EventCategory).forEach(c => counts[c] = 0);
    events.forEach(e => {
      // Handle legacy/fallback if needed, or just count
      if (counts[e.category] !== undefined) counts[e.category]++;
    });
    return counts;
  }, [events]);



  const handleRefreshData = async () => {
    setLoading(true);

    try {
      // NEW: Load events from Supabase (backend cache)
      // NO direct API calls - data collected by backend collectors
      const supabaseEvents = await loadAllEvents();

      // Also load collector statuses
      const statuses = await getCollectorStatuses();
      setDataSourceStatuses(statuses.map((s: any) => ({
        source: s.collector_name,
        status: s.circuit_open ? 'error' : (s.enabled ? 'success' : 'disabled'),
        lastUpdate: s.last_success_at ? new Date(s.last_success_at).toISOString() : undefined,
        eventCount: s.total_events_collected || 0,
        error: s.last_error_message
      })));

      // Fallback to mock if nothing loaded
      let updatedEvents = supabaseEvents.length > 0 ? supabaseEvents : MOCK_EVENTS;

      setEvents(updatedEvents);

      // Persist to LocalStorage as offline cache
      localStorage.setItem('monitor_events', JSON.stringify(updatedEvents));

      // Try to trigger manual collection (Edge Function if available)
      await triggerDataCollection();

    } catch (error) {
      console.error('Data refresh error:', error);

      // Fallback to LocalStorage if offline
      const cached = localStorage.getItem('monitor_events');
      if (cached) {
        try {
          setEvents(JSON.parse(cached));
        } catch (e) {
          setEvents(MOCK_EVENTS);
        }
      } else {
        setEvents(MOCK_EVENTS);
      }
    }

    setLoading(false);
  };

  const handleClearCache = () => {
    if (confirm('Clear all cached data and reload? This will refresh from all sources.')) {
      // Clear all localStorage
      localStorage.removeItem('monitor_events');
      localStorage.removeItem('admin_config');
      localStorage.removeItem('priorityPanelOpen');
      localStorage.removeItem('legendPanelOpen');
      localStorage.removeItem('visibleCategories');

      // Reset state
      setEvents([]);

      // Reload page to get fresh data
      window.location.reload();
    }
  };

  const NavButton = ({ target, label, icon: Icon }: { target: ViewState, label: string, icon?: any }) => (
    <button
      onClick={() => { setView(target); setMobileMenuOpen(false); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setView(target);
          setMobileMenuOpen(false);
        }
      }}
      className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-2
        ${view === target ? 'bg-tactical-800 text-tactical-500' : 'text-gray-400 hover:text-white'}`}
      aria-label={`Navigate to ${label}`}
      aria-current={view === target ? 'page' : undefined}
      role="button"
      tabIndex={0}
    >
      {Icon && <Icon className="w-4 h-4 md:hidden" aria-hidden="true" />}
      {label}
    </button>
  );

  const renderContent = () => {
    switch (view) {
      case 'SURVIVAL': return <SurvivalManual />;
      case 'RADIO': return <CommsPanel />;
      case 'TIMELINE': return <ProphecyIntel />;
      case 'LIVE_FEED': return <IntelFeed events={events} />;
      // case 'ADMIN': return <AdminPanel />;
      case 'SITUATION_MAP':
      default:
        return (
          <div className="w-full h-full relative">
            {/* Filter coordinates (0,0) handled inside SituationMap with scatter */}
            <SituationMap events={filteredEvents} />

            {/* Time Filter Controls */}
            <div className="absolute top-4 right-4 z-20 flex gap-1 bg-black/80 p-1 border border-tactical-700 rounded backdrop-blur-sm">
              {[6, 24, 72, 168, 720].map(h => (
                <button
                  key={h}
                  onClick={() => setTimeFilter(h)}
                  className={`px-3 py-1 text-[10px] font-mono border border-transparent hover:border-tactical-500 transition-all
                     ${timeFilter === h
                      ? 'bg-tactical-500/20 text-tactical-400 border-tactical-500 shadow-[0_0_10px_rgba(255,100,0,0.3)]'
                      : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {h === 720 ? 'ALL' : h === 168 ? '7D' : h === 6 ? '6H' : h + 'H'}
                </button>
              ))}
            </div>

            {/* Priority Threats Panel - REPLACED BY LIVE FEED */}
            {filteredEvents.length > 0 && (
              <LiveThreatFeed events={filteredEvents} />
            )}

            {/* Color Legend Panel - REPLACED BY BOTTOM BAR */}
            {/* Kept minimal structure if needed for layout, but removing the panel itself */}

            <BottomFilterBar
              selectedCategories={visibleCategories}
              onToggleCategory={toggleCategory}
              eventCounts={eventCounts}
            />
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-gray-200 flex flex-col overflow-hidden font-mono relative">

      {/* Header */}
      <header
        className="h-14 bg-tactical-900 border-b border-tactical-700 flex items-center justify-between px-4 z-20 shrink-0"
        role="banner"
        aria-label="Main header"
      >
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="text-red-500 animate-pulse-fast text-xl font-bold" aria-hidden="true">◉</div>
            <div>
              <h1 className="font-black text-sm tracking-wider text-white">
                END TIMES MONITOR
              </h1>
              <p className="text-[8px] text-gray-500 uppercase tracking-widest">
                Global Intelligence Platform
              </p>

            </div>
            {/* Isolated Clock Component */}
            <div className="hidden lg:block ml-4 border-l border-tactical-800 pl-4">
              <Clock />
            </div>
          </div>
        </div>

        {/* Main Nav (Desktop) */}
        <nav
          className="hidden md:flex items-center gap-1"
          role="navigation"
          aria-label="Primary navigation"
        >
          <NavButton target="SITUATION_MAP" label="SITUATION" />
          <NavButton target="LIVE_FEED" label="LIVE WIRE" />
          <NavButton target="TIMELINE" label="PROPHECY" />
          <NavButton target="SURVIVAL" label="PROTOCOLS" />
          <NavButton target="RADIO" label="COMMS" />
          {/* <NavButton target="ADMIN" label="ADMIN" /> */}
        </nav>

        {/* Data Source Status (Desktop) */}
        {dataSourceStatuses.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-tactical-800/50 border border-tactical-700 rounded text-[10px]">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${dataSourceStatuses.some(s => s.status === 'active') ? 'bg-[#c19a6b] animate-pulse' : 'bg-gray-500'
                }`} />
              <span className="text-gray-400">
                {dataSourceStatuses.filter(s => s.status === 'active').length}/{dataSourceStatuses.length} SOURCES
              </span>
            </div>
            <span className="text-tactical-500 font-bold">
              {filteredEvents.length} / {events.length} VISIBLE
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
            onClick={handleClearCache}
            className="flex items-center gap-2 px-3 py-1 bg-red-900/50 border border-red-700 hover:bg-red-800 text-red-300 text-xs transition-colors"
            title="Clear cache and reload fresh data"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">CLEAR</span>
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
          {/* <NavButton target="ADMIN" label="ADMINISTRATION" icon={Settings} /> */}
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
            {/* <div className="h-80">
              <h3 className="text-xs text-tactical-500 mb-2 flex items-center gap-2"><Cpu className="w-3 h-3" /> AI TACTICAL ADVISOR</h3>
              <AIChat events={events} />
            </div> */}
          </div>
        </div>


      </div>
    </div>
  );
};

export default App;