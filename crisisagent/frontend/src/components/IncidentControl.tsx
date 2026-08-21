import { useState } from 'react';
import { Flame, RefreshCw, XCircle, Cpu } from 'lucide-react';
import { BuildingSelector } from './BuildingSelector';
import { BuildingData } from '../types';

interface IncidentControlProps {
  onStartIncident: (zoneId: string) => Promise<void>;
  onClearIncidents: () => Promise<void>;
  onResetBuilding: () => Promise<void>;
  onLoadDemo: (id: string) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  currentBuilding: BuildingData | null;
  zones: string[];
}

export function IncidentControl({
  onStartIncident,
  onClearIncidents,
  onResetBuilding,
  onLoadDemo,
  onUpload,
  currentBuilding,
  zones
}: IncidentControlProps) {
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [backend, setBackend] = useState('mock');
  const [spreadSpeed, setSpreadSpeed] = useState('normal');

  const handleBackendChange = async (newBackend: string) => {
    setBackend(newBackend);
    try {
      await fetch('/api/config/backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision: newBackend,
          reasoning: newBackend
        })
      });
    } catch (e) {
      console.error('Failed to switch backend:', e);
    }
  };

  const handleSpeedChange = async (newSpeed: string) => {
    setSpreadSpeed(newSpeed);
    try {
      await fetch('/api/simulation/speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed: newSpeed })
      });
    } catch (e) {
      console.error('Failed to change spread speed:', e);
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-t border-slate-800">
      <div className="flex items-center space-x-4">
        <BuildingSelector 
          onLoadDemo={onLoadDemo} 
          onUpload={onUpload} 
          currentBuilding={currentBuilding} 
        />
      </div>

      <div className="flex items-center space-x-4">
        {/* Fire Spread Speed Mode */}
        <div className="flex items-center space-x-2 border-r border-slate-800 pr-4">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-slate-400 font-medium">Burn Speed:</span>
          <select 
            value={spreadSpeed}
            onChange={(e) => handleSpeedChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono px-2 py-1.5 text-slate-200 outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="slow">🐢 Slow (Realistic)</option>
            <option value="normal">⚡ Normal</option>
            <option value="fast">🔥 Fast</option>
            <option value="paused">⏸️ Paused</option>
          </select>
        </div>

        <div className="flex items-center space-x-2.5 border-r border-slate-800 pr-5">
          <Cpu className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">AI Engine:</span>
          <select 
            value={backend}
            onChange={(e) => handleBackendChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono px-2.5 py-1.5 text-slate-200 outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="mock">Offline Agent (Mock)</option>
            <option value="groq">Groq Llama 3.3 (Fastest)</option>
            <option value="gemini">Gemini 2.5 Flash</option>
            <option value="ollama">Ollama Local</option>
          </select>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onResetBuilding}
            className="flex items-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Reset State
          </button>
          
          <button
            onClick={onClearIncidents}
            className="flex items-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
          >
            <XCircle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Clear Fire
          </button>

          <div className="relative">
            <button
              onClick={() => setShowZonePicker(!showZonePicker)}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-red-600/30 active:scale-95"
            >
              <Flame className="w-4 h-4 mr-1.5 text-amber-200 animate-pulse" />
              Trigger Fire
            </button>

            {showZonePicker && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-slate-800/80 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-64 flex flex-col p-1.5 backdrop-blur">
                <div className="p-2 border-b border-slate-700 text-xs font-bold text-slate-300">
                  Select Ignition Zone
                </div>
                <div className="overflow-y-auto flex-1 p-1 space-y-1">
                  {zones.length > 0 ? zones.map(z => (
                    <button
                      key={z}
                      onClick={() => {
                        onStartIncident(z);
                        setShowZonePicker(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-red-600/20 hover:text-red-300 rounded-md transition-colors flex items-center justify-between"
                    >
                      <span className="font-mono font-semibold">{z}</span>
                      <span className="text-[10px] text-slate-500">Ignite 🔥</span>
                    </button>
                  )) : (
                    <div className="p-3 text-xs text-slate-500 text-center">No building loaded</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
