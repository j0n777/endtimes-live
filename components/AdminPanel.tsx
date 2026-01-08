import React, { useState, useEffect } from 'react';
import { AdminConfig } from '../types';
import { Settings, Save, Plus, Trash2, AlertCircle, Database, Globe, Key } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [config, setConfig] = useState<AdminConfig>({
    telegramApiId: '',
    telegramApiHash: '',
    telegramPhone: '',
    customChannels: [],
    newsApiKey: '',
    nasaApiKey: '',
    acledApiKey: '',
    // Phase 1 Data Sources
    gdacsEnabled: true,
    nasaEonetApiKey: '',
    acledEmail: '',
    whoEnabled: true,
    gdeltEnabled: true,
    nasaFirmsApiKey: '',
  });
  const [newChannel, setNewChannel] = useState('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('admin_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('admin_config', JSON.stringify(config));
    setSaveStatus('CONFIGURATION SAVED - UPLINK UPDATED');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const addChannel = () => {
    if (newChannel && !config.customChannels.includes(newChannel)) {
      setConfig(prev => ({
        ...prev,
        customChannels: [...prev.customChannels, newChannel.replace('@', '').replace('t.me/', '')]
      }));
      setNewChannel('');
    }
  };

  const removeChannel = (channel: string) => {
    setConfig(prev => ({
      ...prev,
      customChannels: prev.customChannels.filter(c => c !== channel)
    }));
  };

  return (
    <div className="h-full bg-[#050505] text-gray-200 font-mono p-6 overflow-y-auto custom-scrollbar flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-3 mb-8 border-b border-tactical-700 pb-4">
          <div className="p-3 bg-tactical-800 rounded text-tactical-500">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-widest">SYSTEM ADMINISTRATION</h1>
            <div className="text-xs text-gray-500">DATA SOURCE CONFIGURATION</div>
          </div>
        </div>

        {/* Telegram Section */}
        <div className="bg-tactical-900 border border-tactical-700 p-6 rounded-lg mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">TELEGRAM DATA UPLINK</h2>
          </div>

          <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-gray-300">
              <strong className="text-blue-400 block mb-1">OPERATIONAL NOTE:</strong>
              For security and stability in this browser environment, we utilize the <strong>Public Channel Scanner Protocol</strong>.
              By providing channel IDs below, the AI OSINT Engine will actively scrape the public web views (t.me/s/) of these channels for real-time intel.
            </div>
          </div>

          <div className="border-t border-tactical-800 pt-6">
            <h3 className="text-sm font-bold text-tactical-500 mb-4">TARGET CHANNELS (OSINT SOURCES)</h3>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newChannel}
                onChange={e => setNewChannel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChannel()}
                className="flex-1 bg-black border border-tactical-700 p-2 text-sm text-white focus:border-tactical-500 outline-none rounded"
                placeholder="e.g. intel_slava, warmonitors, etc"
              />
              <button onClick={addChannel} className="bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 text-white p-2 rounded">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
              {config.customChannels.map(channel => (
                <div key={channel} className="flex justify-between items-center bg-tactical-800/50 p-2 rounded border border-tactical-800">
                  <span className="text-sm text-gray-300">@{channel}</span>
                  <button onClick={() => removeChannel(channel)} className="text-red-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {config.customChannels.length === 0 && (
                <div className="text-xs text-gray-600 italic text-center py-2">No custom channels configured. Using default feed list.</div>
              )}
            </div>
          </div>
        </div>

        {/* External APIs Section */}
        <div className="bg-tactical-900 border border-tactical-700 p-6 rounded-lg mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-tactical-warn" />
            <h2 className="text-lg font-bold text-white">EXTERNAL API INTEGRATIONS</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Key className="w-3 h-3" /> NEWS API KEY (newsapi.org)
              </label>
              <input
                type="text"
                value={config.newsApiKey || ''}
                onChange={e => setConfig({ ...config, newsApiKey: e.target.value })}
                className="w-full bg-black border border-tactical-700 p-2 text-sm text-gray-300 focus:border-tactical-500 outline-none rounded"
                placeholder="Enter API Key for Enhanced News Gathering"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Key className="w-3 h-3" /> NASA EONET KEY (api.nasa.gov)
              </label>
              <input
                type="text"
                value={config.nasaApiKey || ''}
                onChange={e => setConfig({ ...config, nasaApiKey: e.target.value })}
                className="w-full bg-black border border-tactical-700 p-2 text-sm text-gray-300 focus:border-tactical-500 outline-none rounded"
                placeholder="Enter API Key for Natural Disaster Data"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Key className="w-3 h-3" /> ACLED ACCESS KEY (acleddata.com)
              </label>
              <input
                type="text"
                value={config.acledApiKey || ''}
                onChange={e => setConfig({ ...config, acledApiKey: e.target.value })}
                className="w-full bg-black border border-tactical-700 p-2 text-sm text-gray-300 focus:border-tactical-500 outline-none rounded"
                placeholder="Enter Key for Conflict Data"
              />
            </div>
            <p className="text-[10px] text-gray-600 italic pt-2">
              * Entering keys here will allow the system to cross-reference data sources. Keys are stored locally in your browser.
            </p>
          </div>
        </div>

        {/* Phase 1 Data Sources Section */}
        <div className="bg-tactical-900 border border-tactical-700 p-6 rounded-lg mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold text-white">PHASE 1 DATA SOURCES</h2>
          </div>

          <div className="bg-green-900/10 border border-green-900/30 p-4 rounded mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
            <div className="text-xs text-gray-300">
              <strong className="text-green-400 block mb-1">PRIORITY INTEGRATIONS:</strong>
              These are the Phase 1 critical data sources that dramatically expand event coverage. Toggle sources on/off or add API keys for authenticated access.
            </div>
          </div>

          <div className="space-y-4">
            {/* GDACS - No Auth */}
            <div className="flex items-center justify-between bg-tactical-800/50 p-3 rounded border border-tactical-800">
              <div>
                <div className="text-sm font-bold text-white">GDACS - Global Disaster Alerts</div>
                <div className="text-[10px] text-gray-500">Earthquakes, Tsunamis, Cyclones, Floods, Volcanoes | No Auth Required</div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={config.gdacsEnabled !== false}
                  onChange={e => setConfig({ ...config, gdacsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-full h-full bg-gray-700 peer-checked:bg-green-600 rounded-full transition-colors cursor-pointer"></div>
                <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </div>

            {/* WHO - No Auth */}
            <div className="flex items-center justify-between bg-tactical-800/50 p-3 rounded border border-tactical-800">
              <div>
                <div className="text-sm font-bold text-white">WHO - Disease Outbreaks</div>
                <div className="text-[10px] text-gray-500">Health Emergencies, Epidemics, Pandemics | No Auth Required</div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={config.whoEnabled !== false}
                  onChange={e => setConfig({ ...config, whoEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-full h-full bg-gray-700 peer-checked:bg-green-600 rounded-full transition-colors cursor-pointer"></div>
                <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </div>

            {/* GDELT - No Auth */}
            <div className="flex items-center justify-between bg-tactical-800/50 p-3 rounded border border-tactical-800">
              <div>
                <div className="text-sm font-bold text-white">GDELT - Global Events Database</div>
                <div className="text-[10px] text-gray-500">Real-time global news monitoring, 100+ languages | No Auth Required</div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={config.gdeltEnabled !== false}
                  onChange={e => setConfig({ ...config, gdeltEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-full h-full bg-gray-700 peer-checked:bg-green-600 rounded-full transition-colors cursor-pointer"></div>
                <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </div>

            {/* NASA EONET - Optional Key */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Key className="w-3 h-3" /> NASA EONET API KEY (Optional - eonet.gsfc.nasa.gov)
              </label>
              <input
                type="text"
                value={config.nasaEonetApiKey || ''}
                onChange={e => setConfig({ ...config, nasaEonetApiKey: e.target.value })}
                className="w-full bg-black border border-tactical-700 p-2 text-sm text-gray-300 focus:border-tactical-500 outline-none rounded"
                placeholder="Works without key, but key provides higher rate limits"
              />
              <div className="text-[10px] text-gray-500 mt-1">Wildfires, Storms, Volcanoes, Floods, Droughts</div>
            </div>

            {/* ACLED - Requires Key + Email */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Key className="w-3 h-3" /> ACLED API KEY (Required - acleddata.com)
              </label>
              <input
                type="text"
                value={config.acledApiKey || ''}
                onChange={e => setConfig({ ...config, acledApiKey: e.target.value })}
                className="w-full bg-black border border-tactical-700 p-2 text-sm text-gray-300 focus:border-tactical-500 outline-none rounded mb-2"
                placeholder="Register for free at acleddata.com"
              />
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Key className="w-3 h-3" /> ACLED EMAIL
              </label>
              <input
                type="email"
                value={config.acledEmail || ''}
                onChange={e => setConfig({ ...config, acledEmail: e.target.value })}
                className="w-full bg-black border border-tactical-700 p-2 text-sm text-gray-300 focus:border-tactical-500 outline-none rounded"
                placeholder="Email used for ACLED registration"
              />
              <div className="text-[10px] text-gray-500 mt-1">Armed Conflicts, Battles, Protests, Violence (3000 req/year free)</div>
            </div>

            {/* NASA FIRMS - Requires Key */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Key className="w-3 h-3" /> NASA FIRMS API KEY (Required - firms.modaps.eosdis.nasa.gov)
              </label>
              <input
                type="text"
                value={config.nasaFirmsApiKey || ''}
                onChange={e => setConfig({ ...config, nasaFirmsApiKey: e.target.value })}
                className="w-full bg-black border border-tactical-700 p-2 text-sm text-gray-300 focus:border-tactical-500 outline-none rounded"
                placeholder="Register for free key"
              />
              <div className="text-[10px] text-gray-500 mt-1">Active Fires, Thermal Anomalies (Near real-time, 3-4 hour delay)</div>
            </div>

            <p className="text-[10px] text-gray-600 italic pt-2">
              * Free tier sources work without authentication. API keys enhance functionality and remove rate limits.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-tactical-500 font-bold animate-pulse">{saveStatus}</span>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-tactical-500 hover:bg-green-600 text-black px-6 py-3 rounded font-bold transition-colors"
          >
            <Save className="w-5 h-5" />
            SAVE CONFIGURATION
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;