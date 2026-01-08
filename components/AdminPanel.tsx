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
    acledApiKey: ''
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
                onChange={e => setConfig({...config, newsApiKey: e.target.value})}
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
                onChange={e => setConfig({...config, nasaApiKey: e.target.value})}
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
                onChange={e => setConfig({...config, acledApiKey: e.target.value})}
                className="w-full bg-black border border-tactical-700 p-2 text-sm text-gray-300 focus:border-tactical-500 outline-none rounded"
                placeholder="Enter Key for Conflict Data"
              />
            </div>
            <p className="text-[10px] text-gray-600 italic pt-2">
              * Entering keys here will allow the system to cross-reference data sources. Keys are stored locally in your browser.
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