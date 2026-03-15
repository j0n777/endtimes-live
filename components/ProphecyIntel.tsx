import React, { useState } from 'react';
import {
  BIBLICAL_PROPHECIES,
  ISLAMIC_PROPHECIES,
  PROPHECY_STATS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  ProphecyCategory,
  ExtendedProphecyEvent
} from '../prophecyIndex';
import { BookOpen, CheckCircle, Clock, CircleDashed, AlertTriangle, ChevronDown, ChevronRight, Filter, ShieldAlert } from 'lucide-react';
import { useLocale } from '../lib/i18n';
import { SEOHead } from './SEOHead';

const ProphecyIntel: React.FC = () => {
  const { t } = useLocale();
  // ... existing state ... 
  const [selectedCategory, setSelectedCategory] = useState<ProphecyCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'FULFILLED' | 'IN_PROGRESS' | 'PENDING'>('ALL');
  const [expandedProphecy, setExpandedProphecy] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showIslamicSection, setShowIslamicSection] = useState(true);

  // DEEP LINKING: Check URL for prophecy ID
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prophecyId = params.get('prophecy');
    if (prophecyId) {
      setExpandedProphecy(prophecyId);
      // Scroll to element if possible (would need refs, deferring for now)
    }
  }, []);

  // SEO SCHEMA: Generate ClaimReview for expanded prophecy
  const activeProphecy = React.useMemo(() => {
    if (!expandedProphecy) return null;
    return [...BIBLICAL_PROPHECIES, ...ISLAMIC_PROPHECIES].find(p => p.id === expandedProphecy);
  }, [expandedProphecy]);

  const prophecySchema = React.useMemo(() => {
    if (!activeProphecy) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ClaimReview",
      "datePublished": "2024-01-01",
      "url": `https://endtimes.live/?prophecy=${activeProphecy.id}`,
      "itemReviewed": {
        "@type": "Claim",
        "author": {
          "@type": "Person",
          "name": "Biblical Prophet"
        },
        "datePublished": "0033",
        "appearance": {
          "@type": "CreativeWork",
          "name": activeProphecy.scripture
        }
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": activeProphecy.status === 'FULFILLED' ? 5 : (activeProphecy.status === 'IN_PROGRESS' ? 3 : 1),
        "bestRating": 5,
        "worstRating": 1,
        "alternateName": activeProphecy.status
      },
      "author": {
        "@type": "Organization",
        "name": "End Times Monitor"
      }
    };
  }, [activeProphecy]);

  // --- FILTERING LOGIC ---
  const filteredBiblical = React.useMemo(() => {
    return BIBLICAL_PROPHECIES.filter(p => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      return matchCat && matchStatus;
    });
  }, [selectedCategory, selectedStatus]);

  const filteredIslamic = React.useMemo(() => {
    // Only show if category is ALL or explicitly ISLAM_WARNING
    if (selectedCategory !== 'ALL' && selectedCategory !== 'ISLAM_WARNING') return [];

    // Islamic prophecies don't strictly follow Biblical status, but we can filter if needed.
    // For now, assume they are mostly "IN_PROGRESS" or "PENDING" equivalents for warning purposes.
    return ISLAMIC_PROPHECIES.filter(p => {
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      return matchStatus;
    });
  }, [selectedCategory, selectedStatus]);

  // --- RENDER HELPERS ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FULFILLED': return 'text-green-500 border-green-500/50 bg-green-900/10';
      case 'IN_PROGRESS': return 'text-yellow-500 border-yellow-500/50 bg-yellow-900/10';
      case 'PENDING': return 'text-gray-500 border-gray-600 bg-gray-800/20';
      default: return 'text-gray-500 border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FULFILLED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <CircleDashed className="w-4 h-4 animate-spin-slow" />; // Ensure animate-spin-slow exists or use animate-spin
      case 'PENDING': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const renderProphecyCard = (prophecy: ExtendedProphecyEvent, isIslamic: boolean) => {
    const isExpanded = expandedProphecy === prophecy.id;
    const colorClass = isIslamic ? 'border-red-900/50 bg-red-950/20' : 'border-tactical-700 bg-tactical-900/40';
    const accentColor = isIslamic ? 'text-red-500' : 'text-tactical-500';

    return (
      <div
        key={prophecy.id}
        id={prophecy.id}
        className={`mb-6 ml-8 relative border rounded-lg p-4 transition-all duration-300 ${colorClass} ${isExpanded ? 'shadow-[0_0_15px_rgba(0,0,0,0.5)] border-l-4 border-l-' + (isIslamic ? 'red-500' : 'tactical-500') : 'hover:border-opacity-100 border-opacity-50'}`}
      >
        {/* Timeline Dot */}
        <div className={`absolute -left-[45px] top-6 w-5 h-5 rounded-full border-4 border-[#050505] flex items-center justify-center
            ${prophecy.status === 'FULFILLED' ? 'bg-green-500' :
            prophecy.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
              'bg-gray-600'}
        `}>
        </div>

        {/* Header Clickable */}
        <div
          className="cursor-pointer flex items-start justify-between gap-4"
          onClick={() => setExpandedProphecy(isExpanded ? null : prophecy.id)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(prophecy.status)}`}>
                {prophecy.status.replace('_', ' ')}
              </span>
              {isIslamic && <span className="text-[10px] font-bold uppercase text-red-500 border border-red-500/30 px-2 py-0.5 rounded">WARNING</span>}
            </div>
            <h3 className={`text-lg font-bold ${isIslamic ? 'text-red-100' : 'text-gray-100'}`}>{prophecy.title}</h3>
            <div className={`text-sm font-serif italic opacity-80 mt-1 ${accentColor}`}>"{prophecy.scripture}"</div>
          </div>
          <div>
            {isExpanded ? <ChevronDown className={`w-5 h-5 ${accentColor}`} /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-800 animate-fadeIn">
            <p className="text-gray-300 leading-relaxed text-sm mb-4">{prophecy.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 p-3 rounded">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Key Indicators</h4>
                <ul className="space-y-1">
                  {prophecy.relatedEvents?.map((ev, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <CircleDashed className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
                      {ev}
                    </li>
                  )) || <li className="text-xs text-gray-600">No specific indicators listed.</li>}
                </ul>
              </div>

              {isIslamic && (
                <div className="bg-red-950/30 p-3 rounded border border-red-900/30">
                  <h4 className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> Deception Point</h4>
                  <p className="text-xs text-red-200/70 leading-relaxed">
                    This prophecy mirrors Biblical end-time events but inverts the roles (e.g., the Mahdi sharing characteristics with the Biblical Antichrist).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-[#050505] text-gray-200 font-mono p-4 md:p-6 overflow-y-auto custom-scrollbar">
      {/* Inject Dynamic SEO if Prophecy Selected */}
      {activeProphecy && (
        <SEOHead
          title={`Prophecy: ${activeProphecy.title}`}
          description={`${activeProphecy.scripture} - ${activeProphecy.description}`}
          schema={prophecySchema}
          type="article"
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* ... rest of render ... */}
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-tactical-700 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-tactical-800 rounded text-tactical-alert">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-widest">{t.prophecy.title}</h1>
              <div className="text-xs text-gray-500">{t.prophecy.subtitle}</div>
            </div>
          </div>

          <div className="text-right w-full md:w-auto">
            <div className="flex flex-wrap gap-2 justify-end">
              <div className="px-3 py-1 bg-tactical-800/50 border border-tactical-700 rounded text-xs">
                <span className="text-gray-500">TOTAL: </span>
                <span className="text-white font-bold">{PROPHECY_STATS.total}</span>
              </div>
              <div className="px-3 py-1 bg-green-900/30 border border-green-700 rounded text-xs">
                <span className="text-gray-500">✓ </span>
                <span className="text-green-400 font-bold">{PROPHECY_STATS.biblical.fulfilled}</span>
              </div>
              <div className="px-3 py-1 bg-yellow-900/30 border border-yellow-700 rounded text-xs">
                <span className="text-gray-500">⏳ </span>
                <span className="text-yellow-400 font-bold">{PROPHECY_STATS.biblical.inProgress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-tactical-800 border border-tactical-700 hover:bg-tactical-700 text-white text-sm transition-colors w-full md:w-auto"
          >
            <Filter className="w-4 h-4" />
            {t.prophecy.filter} {showFilters ? '▼' : '►'}
          </button>

          {showFilters && (
            <div className="mt-3 p-4 bg-tactical-900 border border-tactical-700 rounded space-y-4">
              {/* Category Filter */}
              <div>
                <label className="text-xs text-gray-500 uppercase mb-2 block">Category:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${selectedCategory === 'ALL'
                      ? 'bg-tactical-500 text-black font-bold'
                      : 'bg-tactical-800 text-gray-400 hover:bg-tactical-700'
                      }`}
                  >
                    {t.prophecy.allCategories} ({PROPHECY_STATS.total})
                  </button>
                  {/* Keep category keys but use English Labels */}
                  {Object.keys(CATEGORY_LABELS).map(catKey => {
                    const cat = catKey as ProphecyCategory | 'ISLAM_WARNING';
                    // Don't show ISLAM_WARNING in standard Biblical categories list if you want to keep them separate in logic
                    // But user might want to filter only islam. Let's include it but styling differently maybe.
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        className={`px-3 py-1 text-xs rounded transition-colors ${selectedCategory === cat
                          ? 'bg-tactical-500 text-black font-bold'
                          : 'bg-tactical-800 text-gray-400 hover:bg-tactical-700'
                          }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-xs text-gray-500 uppercase mb-2 block">Status:</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedStatus('ALL')} className={`px-3 py-1 text-xs rounded transition-colors ${selectedStatus === 'ALL' ? 'bg-tactical-500 text-black font-bold' : 'bg-tactical-800 text-gray-400 hover:bg-tactical-700'}`}>
                    {t.prophecy.allStatuses}
                  </button>
                  <button onClick={() => setSelectedStatus('FULFILLED')} className={`px-3 py-1 text-xs rounded transition-colors ${selectedStatus === 'FULFILLED' ? 'bg-green-600 text-white font-bold' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'}`}>
                    {t.prophecy.fulfilled}
                  </button>
                  <button onClick={() => setSelectedStatus('IN_PROGRESS')} className={`px-3 py-1 text-xs rounded transition-colors ${selectedStatus === 'IN_PROGRESS' ? 'bg-yellow-600 text-black font-bold' : 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50'}`}>
                    {t.prophecy.inProgress}
                  </button>
                  <button onClick={() => setSelectedStatus('PENDING')} className={`px-3 py-1 text-xs rounded transition-colors ${selectedStatus === 'PENDING' ? 'bg-gray-600 text-white font-bold' : 'bg-gray-900/30 text-gray-400 hover:bg-gray-900/50'}`}>
                    {t.prophecy.pending}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500">
          <span className="text-white font-bold">{filteredBiblical.length}</span> {t.prophecy.biblical}
          {filteredIslamic.length > 0 && <span> + <span className="text-red-400 font-bold">{filteredIslamic.length}</span> {t.prophecy.islamic}</span>}
        </div>

        {/* 1. BIBLICAL PROPHECIES LIST */}
        <div className="relative border-l-2 border-tactical-800 ml-4 md:ml-8 py-4">
          <div className="absolute -left-6 -top-2 flex items-center gap-2">
            <span className="bg-tactical-900 text-tactical-500 text-[10px] font-bold px-2 py-1 border border-tactical-700 rounded uppercase">
              Biblical Timeline
            </span>
          </div>

          {filteredBiblical.map((prophecy) => renderProphecyCard(prophecy, false))}

          {filteredBiblical.length === 0 && (
            <div className="pl-12 py-4 text-gray-600 italic">No biblical prophecies match selected filters.</div>
          )}
        </div>

        {/* 2. ISLAMIC WARNING SECTION (SEPARATED) */}
        {filteredIslamic.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-6 border-b border-red-900/50 pb-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-red-500 tracking-widest">{t.prophecy.islamic}</h2>
              <div className="text-xs text-red-800/80 uppercase ml-auto border border-red-900/30 px-2 py-1 rounded">
                Islamic Eschatology Parallels
              </div>
            </div>

            <div className="relative border-l-2 border-red-900/30 ml-4 md:ml-8 py-4">
              {filteredIslamic.map((prophecy) => renderProphecyCard(prophecy, true))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProphecyIntel;
