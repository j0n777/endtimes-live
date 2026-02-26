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

import { SEOHead } from './components/SEOHead';

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [viewState, setViewState] = useState<ViewState>('SITUATION_MAP');
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MonitorEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataSourceStatuses, setDataSourceStatuses] = useState<DataSourceStatus[]>([]);

  // LAYER CONTROLS
  const [showTransport, setShowTransport] = useState<boolean>(false);
  const [visibleCategories, setVisibleCategories] = useState<Set<EventCategory>>(
    new Set(Object.values(EventCategory))
  );

  // --- DATA FETCHING ---
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      // Trigger backend collection (if supported in env)
      await triggerDataCollection();

      // Load events
      const data = await loadAllEvents();
      setEvents(data);
      // setFilteredEvents(data); // Handled by effect below

      // Load statuses
      const statuses = await getCollectorStatuses();
      setDataSourceStatuses(statuses);
    } catch (e) {
      console.error('Failed to refresh data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    // In a real app this might clear local storage or call an endpoint
    // For now, we just force reload
    await handleRefreshData();
  };

  // Initial Load
  useEffect(() => {
    handleRefreshData();
  }, []);

  // Filter Logic
  useEffect(() => {
    let filtered = events;

    // Filter Transport
    if (!showTransport) {
      filtered = filtered.filter(e => e.category !== 'TRANSPORT');
    }

    // Filter by Category
    filtered = filtered.filter(e => visibleCategories.has(e.category));

    setFilteredEvents(filtered);
  }, [events, showTransport, visibleCategories]);

  // Navigation Logic
  interface NavButtonProps {
    target: ViewState;
    label: string;
    icon?: React.ElementType;
  }

  const NavButton: React.FC<NavButtonProps> = ({ target, label, icon: Icon }) => (
    <button
      onClick={() => {
        setViewState(target);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-2 px-3 py-2 text-xs font-bold tracking-widest transition-all
              ${viewState === target
          ? 'bg-tactical-800 text-tactical-500 border-b-2 border-tactical-500'
          : 'text-gray-400 hover:text-white hover:bg-tactical-800/50'
        }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );

  // Content Renderer
  const renderContent = () => {
    switch (viewState) {
      case 'SITUATION_MAP':
        return <SituationMap events={filteredEvents} />;
      case 'LIVE_FEED':
        return (
          <div className="h-full overflow-y-auto p-4 md:p-8 flex justify-center">
            <IntelFeed events={events} />
          </div>
        );
      case 'TIMELINE':
        return <ProphecyIntel />;
      case 'SURVIVAL':
        return <SurvivalManual />;
      case 'RADIO':
        return <CommsPanel />;
      case 'AI_INTEL':
        // return <AIChat events={events} />;
        return null;
      default:
        return <SituationMap events={filteredEvents} />;
    }
  };

  // SEO: Deep Linking & Dynamic Schema
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for event_id
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    if (eventId) {
      setSelectedEventId(eventId);
    }
  }, []);

  const selectedEvent = React.useMemo(() => {
    if (!selectedEventId) return null;
    return events.find(e => e.id === selectedEventId);
  }, [events, selectedEventId]);

  const newsSchema = React.useMemo(() => {
    if (!selectedEvent) return null;
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": selectedEvent.title,
      "description": selectedEvent.description,
      "datePublished": selectedEvent.timestamp,
      "dateModified": selectedEvent.timestamp,
      "author": {
        "@type": "Organization",
        "name": selectedEvent.sourceName || "End Times Monitor",
        "url": selectedEvent.sourceUrl || "https://endtimes.live"
      },
      "publisher": {
        "@type": "Organization",
        "name": "End Times Monitor",
        "logo": {
          "@type": "ImageObject",
          "url": "https://endtimes.live/logo_etm.jpg"
        }
      },
      "image": "https://endtimes.live/logo_etm.jpg", // Ideally dynamic map screenshot
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://endtimes.live/?event=${selectedEvent.id}`
      }
    };
  }, [selectedEvent]);

  // --- REAL-TIME UPDATES ---
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [showNewIntelToast, setShowNewIntelToast] = useState(false);

  // Sound Effect Hook
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();

      // Layer 1: The "Tactical Thud" (Triangle Wave)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(150, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);

      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Layer 2: Sub-Bass Impact (Sine Wave)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(60, ctx.currentTime);

      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // ... (Polling Effect remains same) ...
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!loading) {
        // Background refresh
        const latestEvents = await loadAllEvents();
        if (latestEvents.length > 0) {
          const newestId = latestEvents[0].id;

          // Detect NEW item
          if (lastEventId && newestId !== lastEventId) {
            console.log('🚨 NEW INTEL RECEIVED:', newestId);
            playNotificationSound();
            setShowNewIntelToast(true);
            setTimeout(() => setShowNewIntelToast(false), 5000);
          }

          setLastEventId(newestId);

          // Update state if different (Basic check, ideal implementation would merge)
          if (latestEvents.length !== events.length || newestId !== events[0]?.id) {
            handleRefreshData();
          }
        }
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [loading, lastEventId, events]);

  // Track initial load
  useEffect(() => {
    if (events.length > 0 && !lastEventId) {
      setLastEventId(events[0].id);
    }
  }, [events]);


  return (
    <div className="h-screen w-screen bg-black text-gray-200 flex flex-col overflow-hidden font-mono relative">
      <SEOHead
        title={selectedEvent ? `${selectedEvent.title} | Live Intel` : undefined}
        description={selectedEvent ? selectedEvent.description : undefined}
        schema={newsSchema}
        type={selectedEvent ? "article" : "website"}
      />

      {/* NEW INTEL TOAST */}
      <div className={`fixed top-20 right-4 z-50 transition-all duration-500 transform ${showNewIntelToast ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-tactical-900 border border-tactical-500 text-tactical-500 px-4 py-3 rounded shadow-[0_0_15px_rgba(193,154,107,0.3)] flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-tactical-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
            <div className="w-3 h-3 bg-tactical-500 rounded-full relative"></div>
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-widest">NEW INTEL RECEIVED</h4>
            <p className="text-[10px] text-gray-400">Syncing database...</p>
          </div>
        </div>
      </div>

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
            <img
              src="/logo_etm.jpg"
              alt="ETM Logo"
              className="h-10 w-10 object-contain rounded-md border border-tactical-500/50 shadow-[0_0_10px_rgba(193,154,107,0.2)]"
            />
            <div>
              <h1 className="font-black text-sm tracking-wider text-white leading-tight">
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
          {/* Status Indicator (replaces buttons) */}
          <div className="flex items-center gap-2 px-3 py-1 bg-black/50 border border-tactical-900 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="uppercase tracking-wider text-[10px]">SYSTEM ONLINE</span>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-3 py-1 bg-tactical-800 border border-tactical-700 hover:bg-tactical-700 text-xs text-white transition-colors"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">INTEL</span>
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
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative bg-[#050505] overflow-hidden">
        {renderContent()}

        {/* LEFT OVERLAY: Live Threat Feed (Visible in SITUATION_MAP) */}
        {viewState === 'SITUATION_MAP' && (
          <LiveThreatFeed events={events} />
        )}

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

            {/* LAYERS CONTROL */}
            <div className="bg-black/40 p-4 rounded border border-tactical-800">
              <h3 className="text-xs text-tactical-500 mb-3 flex items-center gap-2">ACTIVE LAYERS</h3>

              <div className="space-y-3">
                {/* Transport Layer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${showTransport ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'}`}></div>
                    <span className={`text-sm ${showTransport ? 'text-gray-200' : 'text-gray-500'}`}>Global Transport (Air/Sea)</span>
                  </div>
                  <button
                    onClick={() => setShowTransport(!showTransport)}
                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${showTransport ? 'bg-tactical-600' : 'bg-gray-800 border border-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-md ${showTransport ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>

                <hr className="border-t border-tactical-800 my-2" />
                <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Event Categories</p>

                {/* Event Category Toggles */}
                {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
                  /* Skip specific legacy alias categories to avoid clutter */
                  if (category === 'PANDEMIC' || category === 'GOVERNMENT' || category === 'TECHNOLOGY') return null;

                  const color = CATEGORY_COLORS[category as EventCategory] || '#9ca3af';
                  const isVisible = visibleCategories.has(category as EventCategory);

                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isVisible ? color : '#4b5563' }}></div>
                        <span className={`text-sm ${isVisible ? 'text-gray-200' : 'text-gray-500'}`}>{label}</span>
                      </div>
                      <button
                        onClick={() => {
                          const newVisible = new Set(visibleCategories);
                          if (isVisible) {
                            newVisible.delete(category as EventCategory);
                          } else {
                            newVisible.add(category as EventCategory);
                          }
                          setVisibleCategories(newVisible);
                        }}
                        className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isVisible ? 'bg-tactical-600' : 'bg-gray-800 border border-gray-700'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-md ${isVisible ? 'left-4' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
                Toggle categories to filter events on the Intelligence Map. Grayed out categories are suppressed from view.
              </p>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default App;