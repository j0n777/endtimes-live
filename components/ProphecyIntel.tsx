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

const ProphecyIntel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProphecyCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'FULFILLED' | 'IN_PROGRESS' | 'PENDING'>('ALL');
  const [expandedProphecy, setExpandedProphecy] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showIslamicSection, setShowIslamicSection] = useState(true);

  // Filter Biblical Prophecies
  const filteredBiblical = BIBLICAL_PROPHECIES.filter(prophecy => {
    if (selectedCategory !== 'ALL' && prophecy.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && prophecy.status !== selectedStatus) return false;
    return true;
  });

  // Filter Islamic Prophecies (only show if category is ALL or ISLAM_WARNING)
  const showIslamic = (selectedCategory === 'ALL' || selectedCategory === 'ISLAM_WARNING') &&
    (selectedStatus === 'ALL' || selectedStatus === 'PENDING' || selectedStatus === 'IN_PROGRESS'); // Most Islamic represent pending deceptions or in-progress setups

  const filteredIslamic = showIslamic ? ISLAMIC_PROPHECIES : [];

  const getStatusColor = (status: string) => {
    if (status === 'FULFILLED') return 'text-green-500 border-green-500';
    if (status === 'IN_PROGRESS') return 'text-tactical-warn border-tactical-warn';
    return 'text-gray-600 border-gray-600';
  };

  const getWarningColor = (level?: string) => {
    if (level === 'CRITICAL') return 'text-red-500 border-red-500';
    if (level === 'HIGH') return 'text-orange-500 border-orange-500';
    if (level === 'MEDIUM') return 'text-yellow-500 border-yellow-500';
    return 'text-gray-500 border-gray-500';
  };

  const getIcon = (status: string) => {
    if (status === 'FULFILLED') return <CheckCircle className="w-5 h-5" />;
    if (status === 'IN_PROGRESS') return <Clock className="w-5 h-5" />;
    return <CircleDashed className="w-5 h-5" />;
  };

  const toggleProphecy = (id: string) => {
    setExpandedProphecy(expandedProphecy === id ? null : id);
  };

  const renderProphecyCard = (prophecy: ExtendedProphecyEvent, isIslamic: boolean = false) => {
    const isExpanded = expandedProphecy === prophecy.id;

    return (
      <div key={prophecy.id} className="relative pl-8 md:pl-12 mb-6">
        {/* Node on timeline */}
        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#050505] border-2 ${isIslamic ? 'border-red-600' : getStatusColor(prophecy.status)} flex items-center justify-center z-10`}>
          <div className={`w-1.5 h-1.5 rounded-full ${prophecy.status === 'PENDING' ? 'bg-transparent' : 'bg-current'}`}></div>
        </div>

        {/* Connecting Line */}
        <div className="absolute left-[-2px] top-4 bottom-[-24px] w-0.5 bg-tactical-800 last:bg-transparent"></div>

        {/* Content Card */}
        <div className={`bg-tactical-900 border ${isIslamic ? 'border-red-900/50 bg-red-950/10' : 'border-tactical-800'} p-4 md:p-5 rounded hover:border-tactical-600 transition-colors group`}>
          <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1">
              <span className={`p-1 rounded bg-black/50 ${isIslamic ? 'text-red-500 border-red-500' : getStatusColor(prophecy.status)}`}>
                {isIslamic ? <AlertTriangle className="w-5 h-5" /> : getIcon(prophecy.status)}
              </span>
              <h3 className={`text-base md:text-lg font-bold ${isIslamic ? 'text-red-100' : 'text-gray-100'}`}>{prophecy.title}</h3>
              {isIslamic && (
                <span className="px-2 py-0.5 bg-red-900/50 border border-red-700 text-red-400 text-[10px] font-bold rounded animate-pulse">
                  DECEPTION ALERT
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {prophecy.warningLevel && (
                <span className={`px-2 py-1 text-[10px] font-mono rounded border ${getWarningColor(prophecy.warningLevel)} bg-black/50`}>
                  {prophecy.warningLevel}
                </span>
              )}
              <span className="text-xs font-mono px-2 py-1 rounded bg-black text-gray-500 border border-tactical-800">
                {prophecy.scripture}
              </span>
            </div>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            {prophecy.description}
          </p>

          {/* Expand/Collapse Button */}
          {(prophecy.modernEvidence?.length || prophecy.monitoringTips?.length) && (
            <button
              onClick={() => toggleProphecy(prophecy.id)}
              className={`flex items-center gap-2 text-xs ${isIslamic ? 'text-red-400 hover:text-red-300' : 'text-tactical-500 hover:text-white'} transition-colors mb-3`}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {isExpanded ? 'Hide Intel' : 'View Intel & Evidence'}
            </button>
          )}

          {/* Expanded Details */}
          {isExpanded && (
            <div className={`mt-4 space-y-4 border-t ${isIslamic ? 'border-red-900/30' : 'border-tactical-800'} pt-4`}>
              {/* Modern Evidence */}
              {prophecy.modernEvidence && prophecy.modernEvidence.length > 0 && (
                <div>
                  <h4 className={`text-xs uppercase mb-2 flex items-center gap-2 ${isIslamic ? 'text-red-400' : 'text-tactical-500'}`}>
                    <CheckCircle className="w-3 h-3" />
                    Modern Evidence:
                  </h4>
                  <ul className="space-y-1">
                    {prophecy.modernEvidence.map((evidence, idx) => (
                      <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className={`${isIslamic ? 'text-red-500' : 'text-tactical-500'} mt-0.5`}>▸</span>
                        <span>{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Monitoring Tips */}
              {prophecy.monitoringTips && prophecy.monitoringTips.length > 0 && (
                <div>
                  <h4 className="text-xs text-yellow-500 uppercase mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Monitoring Focus:
                  </h4>
                  <ul className="space-y-1">
                    {prophecy.monitoringTips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">⚠</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-gray-600 uppercase tracking-wider mt-3">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-tactical-800 rounded">
                {CATEGORY_LABELS[prophecy.category] || prophecy.category}
              </span>
              <span>STATUS: {STATUS_LABELS[prophecy.status] || prophecy.status.replace('_', ' ')}</span>
            </div>
            {(prophecy.status === 'IN_PROGRESS' || isIslamic) && (
              <span className={`${isIslamic ? 'text-red-500' : 'text-tactical-warn'} animate-pulse`}>
                ACTIVE MONITORING
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#050505] text-gray-200 font-mono p-4 md:p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-tactical-700 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-tactical-800 rounded text-tactical-alert">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-widest">PROPHETIC INTELLIGENCE</h1>
              <div className="text-xs text-gray-500">COMPREHENSIVE ESCHATOLOGICAL DATABASE</div>
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
            FILTERS {showFilters ? '▼' : '►'}
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
                    ALL ({PROPHECY_STATS.total})
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
                  <button
                    onClick={() => setSelectedStatus('ALL')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${selectedStatus === 'ALL'
                        ? 'bg-tactical-500 text-black font-bold'
                        : 'bg-tactical-800 text-gray-400 hover:bg-tactical-700'
                      }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setSelectedStatus('FULFILLED')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${selectedStatus === 'FULFILLED'
                        ? 'bg-green-600 text-white font-bold'
                        : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                      }`}
                  >
                    STATUS_LABELS.FULFILLED
                  </button>
                  <button
                    onClick={() => setSelectedStatus('IN_PROGRESS')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${selectedStatus === 'IN_PROGRESS'
                        ? 'bg-yellow-600 text-black font-bold'
                        : 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50'
                      }`}
                  >
                    STATUS_LABELS.IN_PROGRESS
                  </button>
                  <button
                    onClick={() => setSelectedStatus('PENDING')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${selectedStatus === 'PENDING'
                        ? 'bg-gray-600 text-white font-bold'
                        : 'bg-gray-900/30 text-gray-400 hover:bg-gray-900/50'
                      }`}
                  >
                    STATUS_LABELS.PENDING
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500">
          Showing <span className="text-white font-bold">{filteredBiblical.length}</span> Biblical Prophecies
          {filteredIslamic.length > 0 && <span> + <span className="text-red-400 font-bold">{filteredIslamic.length}</span> Warnings</span>}
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
              <h2 className="text-xl font-bold text-red-500 tracking-widest">DECEPTION WARNINGS</h2>
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
