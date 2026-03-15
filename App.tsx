import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertTriangle, Radio, BookOpen, RefreshCw, Shield, Menu, X, Globe, DollarSign, Cpu, LandPlot, Rss, Settings, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { useLocale } from './lib/i18n';
import { calculateDefcon, DEFCON_META } from './utils/defconCalculator';
import { calculateOmegaIndex, OMEGA_META } from './utils/omegaCalculator';
import { StatusBar } from './components/StatusBar';
import { MOCK_EVENTS } from './constants';
import { ViewState, MonitorEvent, AdminConfig, DataSourceStatus, EventCategory } from './types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from './categoryColors';
import SituationMap from './components/SituationMap';
// import AIChat from './components/AIChat';
import SurvivalManual from './components/SurvivalManual';
import CommsPanel from './components/CommsPanel';
import ProphecyIntel from './components/ProphecyIntel';
import IntelFeed from './components/IntelFeed';
import { LiveThreatFeed } from './components/LiveThreatFeed';
// import AdminPanel from './components/AdminPanel';
// REMOVED: Direct API calls - import { fetchRealTimeEvents } from './services/geminiService';
// REMOVED: Direct API calls - import { fetchAllDataSources } from './services/data-sources';
import { loadAllEvents, loadEventsByCategories, getCollectorStatuses, triggerDataCollection } from './services/frontendDataService';
import { fetchMilitaryAircraft, MilitaryAircraft } from './services/militaryAircraftService';
import { loadConflictZones, ConflictZone } from './services/conflictZoneService';
import { loadNuclearAlerts, NuclearAlert } from './services/nuclearAlertService';
import Clock from './components/Clock';
import { BottomFilterBar } from './components/BottomFilterBar';

import { SEOHead } from './components/SEOHead';

const App: React.FC = () => {
  const { t } = useLocale();

  // --- STATE MANAGEMENT ---
  const [viewState, setViewState] = useState<ViewState>('SITUATION_MAP');
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MonitorEvent[]>([]);
  const [initialCategoryCounts, setInitialCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataSourceStatuses, setDataSourceStatuses] = useState<DataSourceStatus[]>([]);

  // DEFCON — OSINT source (defconlevel.com) takes priority, falls back to event-based calc
  const [osintDefcon, setOsintDefcon] = useState<{ level: 1 | 2 | 3 | 4 | 5; codename: string; source: string } | null>(null);

  useEffect(() => {
    const fetchDefcon = async () => {
      try {
        const res = await fetch('/data/defcon.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data?.level >= 1 && data?.level <= 5) {
            setOsintDefcon({ level: data.level, codename: data.codename, source: data.source });
          }
        }
      } catch { /* silently ignore — fallback to calculated */ }
    };
    fetchDefcon();
    const interval = setInterval(fetchDefcon, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const calculatedDefcon = useMemo(() => calculateDefcon(events), [events]) as 1 | 2 | 3 | 4 | 5;
  const defconLevel = (osintDefcon?.level ?? calculatedDefcon) as 1 | 2 | 3 | 4 | 5;
  const defconMeta = DEFCON_META[defconLevel];

  const omegaLevel = useMemo(() => calculateOmegaIndex(events), [events]);
  const omegaMeta = OMEGA_META[omegaLevel];

  // LAYER CONTROLS
  const [showTransport, setShowTransport] = useState<boolean>(false);
  const [showAircraft, setShowAircraft] = useState<boolean>(false);
  const [militaryAircraft, setMilitaryAircraft] = useState<MilitaryAircraft[]>([]);
  const [aircraftLoading, setAircraftLoading] = useState<boolean>(false);
  const [showConflictZones, setShowConflictZones] = useState<boolean>(true);
  const [conflictZones, setConflictZones] = useState<ConflictZone[]>([]);
  const [showNuclearAlerts, setShowNuclearAlerts] = useState<boolean>(true);
  const [nuclearAlerts, setNuclearAlerts] = useState<NuclearAlert[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<Set<EventCategory>>(
    new Set(Object.values(EventCategory))
  );

  // Military aircraft live polling — 30s initial delay, then every 8 min.
  // The delay prevents the aircraft fetch from running simultaneously with the
  // initial events load, and the longer interval reduces API pressure.
  useEffect(() => {
    if (!showAircraft) {
      setMilitaryAircraft([]);
      return;
    }
    const loadAircraft = async () => {
      setAircraftLoading(true);
      try {
        const data = await fetchMilitaryAircraft();
        setMilitaryAircraft(data);
      } catch (e) {
        console.warn('Military aircraft fetch failed:', e);
      } finally {
        setAircraftLoading(false);
      }
    };
    // Initial fetch after 30s delay (let events/map finish loading first)
    const initTimer = setTimeout(loadAircraft, 30_000);
    // Then poll every 8 minutes
    const interval = setInterval(loadAircraft, 8 * 60 * 1000);
    return () => { clearTimeout(initTimer); clearInterval(interval); };
  }, [showAircraft]);

  // Load conflict zones + nuclear alerts on startup (1-hour client cache in each service)
  useEffect(() => {
    loadConflictZones().then(zones => setConflictZones(zones));
    loadNuclearAlerts().then(alerts => setNuclearAlerts(alerts));
  }, []);

  // ☢ Nuclear alerts are CRITICAL — force layer ON whenever active alerts exist.
  // The layer can still be toggled OFF only when there are no alerts.
  useEffect(() => {
    if (nuclearAlerts.length > 0) {
      setShowNuclearAlerts(true);
    }
  }, [nuclearAlerts]);

  // --- DATA FETCHING ---
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      // Trigger backend collection (if supported in env)
      await triggerDataCollection();

      // Load events
      const data = await loadAllEvents();
      setEvents(data);

      const counts: Record<string, number> = {};
      data.forEach(e => {
        counts[e.category] = (counts[e.category] || 0) + 1;
      });
      setInitialCategoryCounts(counts);

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

  // Filter Logic (for transport layer — category filter now done server-side)
  useEffect(() => {
    let filtered = events;
    if (!showTransport) {
      filtered = filtered.filter(e => e.category !== 'TRANSPORT');
    }
    setFilteredEvents(filtered);
  }, [events, showTransport]);

  const isInitialMount = useRef(true);

  // Per-category server-side refetch — when user selects a subset of categories,
  // fetch the 150 most recent events FOR THOSE CATEGORIES from Supabase.
  // This way selecting "CONFLICT" shows the 150 most recent conflict events,
  // not "conflict events from within the global 150".
  useEffect(() => {
    const allCategories = new Set(Object.values(EventCategory));
    const isAllSelected = visibleCategories.size >= allCategories.size;

    if (isAllSelected && isInitialMount.current) {
      isInitialMount.current = false;
      return; // No change from initial load — global 150 already loaded
    }
    isInitialMount.current = false;

    // Debounce: wait 400ms after last toggle before querying
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const selectedCats = [...visibleCategories] as EventCategory[];
        const data = selectedCats.length > 0
          ? await loadEventsByCategories(selectedCats)
          : await loadAllEvents();
        setEvents(data);
      } catch (e) {
        console.error('Category filter refetch failed:', e);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [visibleCategories]);

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
        return <SituationMap
          events={filteredEvents}
          showAircraft={showAircraft}
          militaryAircraft={militaryAircraft}
          showConflictZones={showConflictZones}
          conflictZones={conflictZones}
          showNuclearAlerts={showNuclearAlerts}
          nuclearAlerts={nuclearAlerts}
        />;
      case 'LIVE_FEED':
        return <IntelFeed events={events} />;
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
        return <SituationMap
          events={filteredEvents}
          showAircraft={showAircraft}
          militaryAircraft={militaryAircraft}
          showConflictZones={showConflictZones}
          conflictZones={conflictZones}
          showNuclearAlerts={showNuclearAlerts}
          nuclearAlerts={nuclearAlerts}
        />;
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
            <h4 className="font-bold text-sm tracking-widest">{t.header.newIntel}</h4>
            <p className="text-[10px] text-gray-400">{t.header.syncing}</p>
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
                {t.header.subtitle}
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
          <NavButton target="SITUATION_MAP" label={t.nav.situation} />
          <NavButton target="LIVE_FEED" label={t.nav.liveFeed} />
          <NavButton target="TIMELINE" label={t.nav.prophecy} />
          <NavButton target="SURVIVAL" label={t.nav.protocols} />
          <NavButton target="RADIO" label={t.nav.comms} />
          {/* <NavButton target="ADMIN" label="ADMIN" /> */}
        </nav>

        {/* Share + Online */}
        <div className="flex items-center gap-3">
          {/* Share button */}
          <button
            onClick={async () => {
              const shareData = {
                title: 'End Times Monitor',
                text: 'Live global event monitoring — geopolitics, disasters, conflicts and more.',
                url: 'https://endtimes.live',
              };
              try {
                if (navigator.share) {
                  await navigator.share(shareData);
                } else {
                  await navigator.clipboard.writeText('https://endtimes.live');
                }
              } catch (e) {
                if ((e as Error).name !== 'AbortError') {
                  await navigator.clipboard.writeText('https://endtimes.live');
                }
              }
            }}
            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest"
            title="Share"
            aria-label="Share this site"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="hidden lg:inline">Share</span>
          </button>
          {/* Online dot */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden lg:inline uppercase tracking-widest">{t.header.online}</span>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 w-full bg-tactical-900 border-b border-tactical-700 z-50 md:hidden flex flex-col p-4 space-y-2 shadow-2xl">
          <NavButton target="SITUATION_MAP" label={t.nav.situation} icon={Globe} />
          <NavButton target="LIVE_FEED" label={t.nav.liveFeed} icon={Rss} />
          <NavButton target="TIMELINE" label={t.nav.prophecy} icon={BookOpen} />
          <NavButton target="SURVIVAL" label={t.nav.protocols} icon={Shield} />
          <NavButton target="RADIO" label={t.nav.comms} icon={Radio} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative bg-[#050505] overflow-hidden pb-8">
        {renderContent()}

        {/* LEFT OVERLAY: Live Threat Feed (Visible in SITUATION_MAP) */}
        {viewState === 'SITUATION_MAP' && (
          <LiveThreatFeed events={events} />
        )}

        {/* Right Sidebar — Layer / Category Filter */}
        <div className={`absolute top-0 right-0 h-full w-72 bg-tactical-900/95 border-l border-tactical-700 transform transition-transform duration-300 z-30 backdrop-blur-md flex flex-col ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-tactical-700 flex justify-between items-center bg-black/40">
            <h2 className="text-xs font-bold tracking-widest text-tactical-400 uppercase">{t.sidebar.title}</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* Transport Layer */}
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">{t.sidebar.activeLayers}</p>
              <button
                onClick={() => setShowTransport(!showTransport)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-sm text-xs font-mono border transition-colors ${showTransport
                  ? 'border-blue-700/50 text-blue-400 bg-blue-900/10'
                  : 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400'
                  }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${showTransport ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'}`} />
                {t.sidebar.transport}
              </button>
              {/* Military Aircraft Live Layer */}
              <button
                onClick={() => setShowAircraft(!showAircraft)}
                className={`flex items-center gap-2 w-full px-3 py-2 mt-1.5 rounded-sm text-xs font-mono border transition-colors ${showAircraft
                  ? 'border-slate-500/60 text-slate-300 bg-slate-800/20'
                  : 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400'
                  }`}
                title="Live military aircraft from adsb.lol"
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${showAircraft ? 'bg-slate-400 animate-pulse' : 'bg-gray-700'}`} />
                ✈ MIL AIRCRAFT {aircraftLoading ? '(loading…)' : showAircraft ? `(${militaryAircraft.length})` : '(live)'}
              </button>

              {/* Conflict Zones Layer */}
              <button
                onClick={() => setShowConflictZones(!showConflictZones)}
                className={`flex items-center gap-2 w-full px-3 py-2 mt-1.5 rounded-sm text-xs font-mono border transition-colors ${showConflictZones
                  ? 'border-red-700/50 text-red-400 bg-red-900/10'
                  : 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400'
                  }`}
                title="Active war zones and conflict areas"
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${showConflictZones ? 'bg-red-500' : 'bg-gray-700'}`} />
                🔴 ZONAS DE CONFLITO {conflictZones.length > 0 ? `(${conflictZones.length})` : ''}
              </button>

              {/* Nuclear Alerts Layer */}
              {nuclearAlerts.length > 0 ? (
                // ☢ LOCKED: When active nuclear alerts exist, layer cannot be hidden
                <div
                  className="flex items-center gap-2 w-full px-3 py-2 mt-1.5 rounded-sm text-xs font-mono border border-purple-600/70 text-purple-300 bg-purple-900/15 cursor-not-allowed select-none"
                  title="☢ Alerta ativo — layer permanente enquanto houver alertas ativos"
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-purple-500 animate-ping" />
                  ☢ ALERTAS NUCLEARES ({nuclearAlerts.length}) 🔒
                </div>
              ) : (
                <button
                  onClick={() => setShowNuclearAlerts(!showNuclearAlerts)}
                  className={`flex items-center gap-2 w-full px-3 py-2 mt-1.5 rounded-sm text-xs font-mono border transition-colors ${showNuclearAlerts
                    ? 'border-purple-700/60 text-purple-300 bg-purple-900/10'
                    : 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400'
                    }`}
                  title="Nuclear strike blast radius visualization"
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${showNuclearAlerts ? 'bg-purple-500 animate-pulse' : 'bg-gray-700'}`} />
                  ☢ ALERTAS NUCLEARES (0)
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">{t.sidebar.categories}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
                  if (category === 'PANDEMIC' || category === 'GOVERNMENT' || category === 'TECHNOLOGY') return null;
                  const count = initialCategoryCounts[category] || 0;
                  if (count === 0) return null;
                  const color = CATEGORY_COLORS[category as EventCategory] || '#9ca3af';
                  const isVisible = visibleCategories.has(category as EventCategory);
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        const next = new Set(visibleCategories);
                        isVisible ? next.delete(category as EventCategory) : next.add(category as EventCategory);
                        setVisibleCategories(next);
                      }}
                      title={isVisible ? 'Click to hide' : 'Click to show'}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-mono border transition-all ${isVisible
                        ? 'border-white/10 text-gray-300 bg-white/5 hover:bg-white/10'
                        : 'border-transparent text-gray-600 opacity-40 hover:opacity-60'
                        }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: isVisible ? color : '#4b5563' }} />
                      {label}
                      <span className="text-gray-500">({count})</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-700 mt-3 leading-relaxed">{t.sidebar.categoriesHint}</p>
            </div>

          </div>
        </div>


        {/* ── Status Bar (bottom) ──────────────────────────────────── */}
        <StatusBar
          omegaLevel={omegaLevel}
          omegaMeta={omegaMeta}
          defconLevel={defconLevel}
          defconMeta={defconMeta}
          osintDefcon={osintDefcon}
          filteredCount={filteredEvents.length}
          totalCount={events.length}
          activeSourceCount={dataSourceStatuses.filter(s => s.status === 'active').length}
          totalSourceCount={dataSourceStatuses.length}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

      </div>
    </div>
  );
};

export default App;