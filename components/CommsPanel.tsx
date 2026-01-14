import React, { useState, useMemo } from 'react';
import { RADIO_CHANNELS } from '../constants';
import type { IARURegion, Continent, RadioLicense, RadioChannel } from '../types';
import { Radio, Signal, Info, Search, Filter, Globe2, MapPin, Shield, Waves } from 'lucide-react';

const CommsPanel: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | IARURegion>('ALL');
  const [selectedContinent, setSelectedContinent] = useState<'ALL' | Continent>('ALL');
  const [selectedLicense, setSelectedLicense] = useState<'ALL' | RadioLicense>('ALL');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBand, setSelectedBand] = useState<'ALL' | 'HF' | 'VHF' | 'UHF' | 'MF'>('ALL');

  // Filter channels based on all criteria
  const filteredChannels = useMemo(() => {
    return RADIO_CHANNELS.filter(ch => {
      // Region filter
      if (selectedRegion !== 'ALL' && ch.region !== selectedRegion && ch.region !== 'GLOBAL') return false;

      // Continent filter
      if (selectedContinent !== 'ALL' && ch.continent !== selectedContinent && ch.continent !== 'GLOBAL') return false;

      // License filter
      if (selectedLicense !== 'ALL' && ch.license !== selectedLicense) return false;

      // Band filter
      if (selectedBand !== 'ALL' && ch.band !== selectedBand) return false;

      // Emergency filter (show only IARU EmComm frequencies or those with specific emergency networks)
      if (emergencyOnly && !ch.network?.includes('EmComm') && !ch.network?.includes('HAMNET') &&
        !ch.network?.includes('RENER') && !ch.description.toLowerCase().includes('emergency') &&
        !ch.description.toLowerCase().includes('distress')) return false;

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          ch.name.toLowerCase().includes(search) ||
          ch.frequency.toLowerCase().includes(search) ||
          ch.description.toLowerCase().includes(search) ||
          ch.network?.toLowerCase().includes(search) ||
          ch.continent.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [selectedRegion, selectedContinent, selectedLicense, selectedBand, emergencyOnly, searchTerm]);

  // Count channels by band for the info cards
  const bandCounts = useMemo(() => ({
    HF: filteredChannels.filter(c => c.band === 'HF').length,
    VHF: filteredChannels.filter(c => c.band === 'VHF').length,
    UHF: filteredChannels.filter(c => c.band === 'UHF').length,
    MF: filteredChannels.filter(c => c.band === 'MF').length,
  }), [filteredChannels]);

  const getLicenseBadgeColor = (license: RadioLicense) => {
    switch (license) {
      case 'NONE': return 'bg-green-900/40 text-green-400 border-green-700/50';
      case 'AMATEUR': return 'bg-blue-900/40 text-blue-400 border-blue-700/50';
      case 'MARINE': return 'bg-cyan-900/40 text-cyan-400 border-cyan-700/50';
      case 'AVIATION': return 'bg-red-900/40 text-red-400 border-red-700/50';
      case 'GMRS': return 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50';
      case 'PMR446': return 'bg-purple-900/40 text-purple-400 border-purple-700/50';
      case 'CB': return 'bg-orange-900/40 text-orange-400 border-orange-700/50';
      case 'WEATHER': return 'bg-sky-900/40 text-sky-400 border-sky-700/50';
      case 'RAILROAD': return 'bg-stone-900/40 text-stone-400 border-stone-700/50';
      case 'BROADCAST': return 'bg-pink-900/40 text-pink-400 border-pink-700/50';
      case 'MONITORING': return 'bg-gray-900/40 text-gray-400 border-gray-700/50';
      default: return 'bg-gray-900/40 text-gray-400 border-gray-700/50';
    }
  };

  return (
    <div className="h-full bg-[#050505] text-gray-200 font-mono p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-tactical-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-tactical-800 rounded text-amber-500">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-widest">SIGNAL INTELLIGENCE</h1>
              <div className="text-xs text-gray-500">GLOBAL FREQUENCY DATABASE • {filteredChannels.length} CHANNELS</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-tactical-500 bg-tactical-900 px-3 py-1 rounded border border-tactical-700">
            <Signal className="w-4 h-4 animate-pulse" />
            <span>MONITORING</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-tactical-900 border border-tactical-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">FILTERS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
            {/* IARU Region Filter */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase mb-1">IARU Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as any)}
                className="w-full bg-black border border-tactical-700 text-white text-xs rounded px-2 py-2 hover:border-tactical-500 transition"
              >
                <option value="ALL">All Regions</option>
                <option value="GLOBAL">🌐 Global Emergency</option>
                <option value="IARU_R1">Region 1 (EU/AF/ME)</option>
                <option value="IARU_R2">Region 2 (Americas)</option>
                <option value="IARU_R3">Region 3 (Asia-Pacific)</option>
              </select>
            </div>

            {/* Continent Filter */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Continent
              </label>
              <select
                value={selectedContinent}
                onChange={(e) => setSelectedContinent(e.target.value as any)}
                className="w-full bg-black border border-tactical-700 text-white text-xs rounded px-2 py-2 hover:border-tactical-500 transition"
              >
                <option value="ALL">All Continents</option>
                <option value="GLOBAL">🌍 Global</option>
                <option value="NORTH_AMERICA">🇺🇸 North America</option>
                <option value="SOUTH_AMERICA">🇧🇷 South America</option>
                <option value="EUROPE">🇪🇺 Europe</option>
                <option value="ASIA">🇨🇳 Asia</option>
                <option value="AFRICA">🇿🇦 Africa</option>
                <option value="OCEANIA">🇦🇺 Oceania</option>
              </select>
            </div>

            {/* License Filter */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                License Type
              </label>
              <select
                value={selectedLicense}
                onChange={(e) => setSelectedLicense(e.target.value as any)}
                className="w-full bg-black border border-tactical-700 text-white text-xs rounded px-2 py-2 hover:border-tactical-500 transition"
              >
                <option value="ALL">All Types</option>
                <option value="NONE">✅ License-Free</option>
                <option value="AMATEUR">Amateur Radio</option>
                <option value="MARINE">Maritime</option>
                <option value="AVIATION">Aviation</option>
                <option value="GMRS">GMRS (US)</option>
                <option value="PMR446">PMR446 (EU)</option>
                <option value="CB">CB Radio</option>
                <option value="WEATHER">🌦️ Weather Services</option>
                <option value="RAILROAD">🚂 Railroad</option>
                <option value="BROADCAST">📻 Shortwave Broadcast</option>
                <option value="MONITORING">👂 Monitor-Only</option>
              </select>
            </div>

            {/* Band Filter */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Waves className="w-3 h-3" />
                Frequency Band
              </label>
              <select
                value={selectedBand}
                onChange={(e) => setSelectedBand(e.target.value as any)}
                className="w-full bg-black border border-tactical-700 text-white text-xs rounded px-2 py-2 hover:border-tactical-500 transition"
              >
                <option value="ALL">All Bands</option>
                <option value="HF">HF (3-30 MHz)</option>
                <option value="VHF">VHF (30-300 MHz)</option>
                <option value="UHF">UHF (300 MHz-3 GHz)</option>
                <option value="MF">MF (300 kHz-3 MHz)</option>
              </select>
            </div>

            {/* Emergency Toggle */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 bg-black border border-tactical-700 px-3 py-2 rounded hover:border-red-700 transition cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={emergencyOnly}
                  onChange={(e) => setEmergencyOnly(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className={`text-xs font-bold ${emergencyOnly ? 'text-red-400' : 'text-gray-400'}`}>
                  🚨 EMERGENCY ONLY
                </span>
              </label>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by frequency, name, network, or continent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-tactical-700 text-white text-xs rounded pl-10 pr-4 py-2 hover:border-tactical-500 focus:border-amber-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Band Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'HF', count: bandCounts.HF, desc: 'Long Range', color: 'blue' },
            { label: 'VHF', count: bandCounts.VHF, desc: 'Regional', color: 'amber' },
            { label: 'UHF', count: bandCounts.UHF, desc: 'Local', color: 'purple' },
            { label: 'MF', count: bandCounts.MF, desc: 'Maritime', color: 'cyan' }
          ].map(({ label, count, desc, color }) => (
            <div key={label} className="bg-tactical-900 border border-tactical-800 p-3 rounded relative overflow-hidden">
              <div className={`text-4xl font-bold text-tactical-800 select-none absolute right-2 top-2 opacity-10`}>{label}</div>
              <div className="text-[10px] text-gray-500 uppercase mb-1">{label} Band • {desc}</div>
              <div className="text-2xl font-mono text-white font-bold">
                {count} <span className="text-xs text-gray-600">CH</span>
              </div>
            </div>
          ))}
        </div>

        {/* Channels Table */}
        <div className="bg-tactical-900 border border-tactical-700 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black text-[10px] text-gray-500 border-b border-tactical-700 uppercase tracking-wider">
                  <th className="p-3 w-16">Band</th>
                  <th className="p-3 w-32">Frequency</th>
                  <th className="p-3 w-20">Mode</th>
                  <th className="p-3 w-24">License</th>
                  <th className="p-3 min-w-[200px]">Designation</th>
                  <th className="p-3 w-24">Region</th>
                  <th className="p-3">Description / Network</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tactical-800">
                {filteredChannels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Info className="w-8 h-8 opacity-50" />
                        <p>No channels match your filters</p>
                        <button
                          onClick={() => {
                            setSelectedRegion('ALL');
                            setSelectedContinent('ALL');
                            setSelectedLicense('ALL');
                            setSelectedBand('ALL');
                            setEmergencyOnly(false);
                            setSearchTerm('');
                          }}
                          className="text-xs text-amber-500 hover:text-amber-400 underline mt-2"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredChannels.map(ch => (
                    <tr key={ch.id} className="hover:bg-tactical-800/50 transition-colors group">
                      {/* Band */}
                      <td className="p-3">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded ${ch.band === 'HF' ? 'bg-blue-900/30 text-blue-400' :
                          ch.band === 'VHF' ? 'bg-amber-900/30 text-amber-400' :
                            ch.band === 'UHF' ? 'bg-purple-900/30 text-purple-400' :
                              'bg-cyan-900/30 text-cyan-400'
                          }`}>
                          {ch.band}
                        </span>
                      </td>

                      {/* Frequency */}
                      <td className="p-3 font-mono text-amber-500 font-bold text-sm">{ch.frequency}</td>

                      {/* Mode */}
                      <td className="p-3 text-[10px] text-gray-400 uppercase">{ch.mode}</td>

                      {/* License */}
                      <td className="p-3">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded border ${getLicenseBadgeColor(ch.license)}`}>
                          {ch.license === 'NONE' ? '✅ FREE' : ch.license}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="p-3 font-bold text-white text-sm">{ch.name}</td>

                      {/* Region/Continent */}
                      <td className="p-3 text-[10px] text-gray-400">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-tactical-500">{ch.region}</span>
                          <span className="text-gray-600">{ch.continent}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="p-3 text-xs text-gray-400">
                        <div className="space-y-1">
                          <p>{ch.description}</p>
                          {ch.network && (
                            <p className="text-[10px] text-amber-600/80">
                              📡 Network: <span className="font-bold">{ch.network}</span>
                            </p>
                          )}
                          {ch.restrictions && (
                            <p className="text-[10px] text-red-500/80">
                              ⚠️ {ch.restrictions}
                            </p>
                          )}
                          {ch.notes && (
                            <p className="text-[10px] text-blue-400/70">
                              ℹ️ {ch.notes}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warning Footer */}
        <div className="mt-6 p-4 border border-tactical-700 border-dashed rounded text-xs text-gray-500 flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="font-bold text-red-400">⚠️ CRITICAL NOTICE</p>
            <p>
              <strong>Transmitting</strong> on these frequencies requires appropriate licensing (Amateur Radio, GMRS, Marine, etc.)
              <span className="text-red-400"> except in situations involving immediate threat to life or property</span> where no other
              means of communication is available.
            </p>
            <p>
              <strong>License-Free:</strong> PMR446 (Europe, 0.5W max), CB Radio (varies by country), GMRS (US with license, no exam).
            </p>
            <p className="text-amber-500">
              <strong>Best Practice:</strong> Always LISTEN first. Monitor emergency frequencies but avoid transmitting unless in actual distress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommsPanel;
