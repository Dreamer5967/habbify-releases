import { useState } from 'react';
import { ZoneState_Full, EvacuationDirective } from '../types';
import { 
  Activity, 
  Users, 
  Thermometer, 
  Wind, 
  Power, 
  Flame, 
  Volume2, 
  VolumeX, 
  DoorOpen, 
  Footprints, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

interface ZoneInspectorProps {
  zone: ZoneState_Full | null;
  directive?: EvacuationDirective | null;
  onUpdateOccupancy: (zoneId: string, diff: number) => Promise<void>;
  onToggleSensor: (zoneId: string, sensorType: string, fail: boolean) => Promise<void>;
  onStartIncident: (zoneId: string) => Promise<void>;
}

export function ZoneInspector({ 
  zone, 
  directive,
  onUpdateOccupancy, 
  onToggleSensor, 
  onStartIncident 
}: ZoneInspectorProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!zone) {
    return (
      <div className="flex-1 bg-slate-900 flex items-center justify-center p-8 text-center border-l border-slate-800">
        <div className="flex flex-col items-center text-slate-500 max-w-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3 shadow-inner">
            <Activity className="w-6 h-6 text-slate-400 opacity-60" />
          </div>
          <p className="font-semibold text-sm text-slate-300 mb-1">Zone Telemetry & Instructions</p>
          <p className="text-xs text-slate-500">
            Click any zone pin on the floorplan map to inspect live turn-by-turn evacuation instructions, sensor telemetry, and fault overrides.
          </p>
        </div>
      </div>
    );
  }

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = directive?.voice_announcement || 
      `Attention occupants of ${zone.name}. Current temperature is ${zone.temperature.toFixed(0)} degrees Celsius. Follow designated exit pathways.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const getStateBadge = (state: string) => {
    switch(state) {
      case 'NORMAL': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'ALERT': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse';
      case 'EVACUATING': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'UNOBSERVABLE': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const getTempColor = (temp: number) => {
    if (temp < 35) return 'bg-emerald-500';
    if (temp < 55) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const smokePercent = Math.min(100, Math.max(0, zone.smoke > 1 ? zone.smoke : zone.smoke * 100));
  const isTrapped = directive?.status === 'TRAPPED_SHELTER_IN_PLACE' || (zone.occupancy > 0 && (!directive || directive.path.length === 0) && zone.zone_type !== 'exit');

  return (
    <div className="flex-1 bg-slate-900 border-l border-b border-slate-800 flex flex-col overflow-y-auto">
      {/* Zone Header */}
      <div className="p-4 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center">
              {zone.name}
            </h2>
            <p className="text-xs text-slate-400 uppercase font-mono tracking-wider">
              {zone.zone_id} • {zone.zone_type}
            </p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${getStateBadge(zone.state)}`}>
            {zone.state}
          </div>
        </div>
        
        {zone.hazard && (
          <div className="mt-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center">
            <Flame className="w-4 h-4 text-red-400 mr-2.5 animate-pulse shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-bold text-red-400">
                <span>{zone.hazard.toUpperCase()} HAZARD</span>
                <span>{(zone.hazard_probability * 100).toFixed(0)}% SEVERITY</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-500 rounded-full" 
                  style={{ width: `${zone.hazard_probability * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* ========================================================================= */}
        {/* 🚨 HUMAN EVACUATION INSTRUCTIONS & TURN-BY-TURN DIRECTIVES */}
        {/* ========================================================================= */}
        <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isTrapped ? (
                <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                {isTrapped ? 'Emergency Directives' : 'Evacuation Instructions'}
              </h3>
            </div>

            {/* PA Audio Speech Button */}
            <button
              onClick={handleSpeak}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                isSpeaking 
                  ? 'bg-amber-500 text-slate-950 animate-pulse' 
                  : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'Stop PA' : '🔊 Broadcast PA'}</span>
            </button>
          </div>

          {/* Trapped / Shelter in Place Mode */}
          {isTrapped ? (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
              <div className="flex items-center text-red-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
                <span>ALL EXITS COMPROMISED — SHELTER IN PLACE</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Surrounding hallways are impassable due to extreme heat or smoke. <strong>Do not open the door into the corridor.</strong>
              </p>
              
              <div className="space-y-1.5 pt-1">
                <div className="flex items-start bg-slate-900/60 p-2 rounded-lg text-[11px] text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-mono font-bold flex items-center justify-center mr-2 shrink-0">1</span>
                  <span>Close and seal door cracks with clothing/towels to block toxic fumes.</span>
                </div>
                <div className="flex items-start bg-slate-900/60 p-2 rounded-lg text-[11px] text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-mono font-bold flex items-center justify-center mr-2 shrink-0">2</span>
                  <span>Stay low beneath smoke layer. Move toward exterior windows.</span>
                </div>
                <div className="flex items-start bg-slate-900/60 p-2 rounded-lg text-[11px] text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-mono font-bold flex items-center justify-center mr-2 shrink-0">3</span>
                  <span>Priority rescue extraction has been dispatched for this room.</span>
                </div>
              </div>
            </div>
          ) : directive && directive.steps && directive.steps.length > 0 ? (
            /* Clear Turn-by-Turn Guidance */
            <div className="space-y-2.5">
              {/* Summary Metadata Bar */}
              <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/80 text-[11px]">
                <div className="flex items-center text-emerald-400 font-medium">
                  <DoorOpen className="w-3.5 h-3.5 mr-1.5" />
                  <span>Target Exit: <strong className="text-white font-mono">{directive.target_exit_name || directive.target_exit_id}</strong></span>
                </div>
                <div className="flex items-center text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>~{directive.estimated_time_seconds}s</span>
                </div>
              </div>

              {/* Step-by-Step List */}
              <div className="space-y-1.5">
                {directive.steps.map((st) => (
                  <div 
                    key={st.step_num} 
                    className="p-2.5 bg-slate-900/70 hover:bg-slate-900 rounded-xl border border-slate-700 flex items-start space-x-2.5 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {st.step_num}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-700/80 text-slate-300 uppercase">
                          {st.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {st.from_zone} ➔ {st.to_zone}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-200 leading-snug">
                        {st.instruction}
                      </p>
                      {st.warning && (
                        <p className="text-[10px] text-amber-400 mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />
                          {st.warning}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/60 rounded-xl text-center text-slate-400">
              <Footprints className="w-5 h-5 mx-auto mb-1.5 text-slate-500" />
              <p className="font-semibold text-slate-300">No Evacuation Required</p>
              <p className="text-[11px] text-slate-500">Zone is currently in nominal conditions.</p>
            </div>
          )}
        </div>

        {/* Live Sensor Telemetry */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <Thermometer className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Live Sensor Telemetry
          </h3>
          
          <div className="grid grid-cols-2 gap-2.5">
            {/* Temperature Metric */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Temperature</span>
                <span className="font-mono font-bold text-slate-200">{zone.temperature.toFixed(1)}°C</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getTempColor(zone.temperature)} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, Math.max(0, (zone.temperature / 120) * 100))}%` }}
                />
              </div>
            </div>

            {/* Smoke Metric */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="flex items-center"><Wind className="w-3 h-3 mr-1" /> Smoke</span>
                <span className="font-mono font-bold text-slate-200">{smokePercent.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-500 rounded-full"
                  style={{ width: `${smokePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Occupant Counter */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-2">
            <Users className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Occupancy & Personnel
          </h3>
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl font-black text-white mr-2.5 font-mono">{zone.occupancy}</span>
              <span className="text-slate-400 font-medium">Individuals present</span>
            </div>
            <div className="flex space-x-1.5">
              <button 
                onClick={() => onUpdateOccupancy(zone.zone_id, -1)}
                disabled={zone.occupancy <= 0}
                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center disabled:opacity-40 transition-colors"
              >-</button>
              <button 
                onClick={() => onUpdateOccupancy(zone.zone_id, 1)}
                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center transition-colors"
              >+</button>
            </div>
          </div>
        </div>

        {/* Sensor Bundle & Fault Injection Controls */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-2">
            <Power className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Virtual Sensor Health
          </h3>
          <div className="space-y-1.5">
            {Object.entries(zone.sensor_status).map(([type, status]) => (
              <div key={type} className="bg-slate-800/70 rounded-lg px-3 py-2 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center capitalize">
                  <div className={`w-2 h-2 rounded-full mr-2.5 ${status === 'ONLINE' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-red-500 shadow-sm shadow-red-500/50'}`} />
                  <span className="text-slate-300 font-medium">{type} sensor</span>
                </div>
                <button
                  onClick={() => onToggleSensor(zone.zone_id, type, status === 'ONLINE')}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-semibold font-mono transition-colors ${
                    status === 'ONLINE' 
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                  }`}
                >
                  {status === 'ONLINE' ? 'Kill Sensor' : 'Restore'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Ignition Action */}
        {zone.state === 'NORMAL' && (
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => onStartIncident(zone.zone_id)}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-red-600/30 active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 mr-1.5 text-amber-200 animate-pulse" /> Ignite Fire in {zone.zone_id}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

