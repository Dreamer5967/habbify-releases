import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { FloorPlanCanvas } from './components/FloorPlanCanvas';
import { ZoneInspector } from './components/ZoneInspector';
import { IncidentFeed } from './components/IncidentFeed';
import { IncidentControl } from './components/IncidentControl';
import { useWebSocket } from './hooks/useWebSocket';
import { WorldState, BuildingData, AgentAction, WSMessage } from './types';
import { Loader2, Volume2 } from 'lucide-react';

function App() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleWSMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case 'world_state':
        if (msg.data) {
          setWorldState(msg.data);
        }
        break;
      case 'agent_action':
        if (msg.action) {
          const actionItem: AgentAction = {
            id: Date.now() + Math.random(),
            incident_id: null,
            action: msg.action,
            args: msg.args || {},
            reason: msg.reason || '',
            triggered_by: 'sensor_delta',
            created_at: msg.timestamp || new Date().toISOString(),
            result: msg.result,
          };
          setAgentActions(prev => [actionItem, ...prev].slice(0, 100));
        }
        break;
      case 'agent_analysis':
        if (msg.content) {
          const actionItem: AgentAction = {
            id: Date.now() + Math.random(),
            incident_id: null,
            action: 'ANALYSIS',
            args: {},
            reason: msg.content,
            triggered_by: 'llm_reasoning',
            created_at: msg.timestamp || new Date().toISOString(),
          };
          setAgentActions(prev => [actionItem, ...prev].slice(0, 100));
        }
        break;
      case 'building_loaded':
        if (msg.data) {
          setBuildingData(msg.data);
        }
        break;
    }
  }, []);

  const { connected } = useWebSocket({
    url: '/ws',
    onMessage: handleWSMessage
  });

  const loadDemo = async (id: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/buildings/demo/${id}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBuildingData(data.building);
        if (data.world_state) {
          setWorldState(data.world_state);
        }
        setAgentActions([]);
        setSelectedZoneId(null);
        setBgImageUrl(null);
      } else {
        const err = await res.text();
        setErrorMessage(`Failed to load demo: ${err}`);
      }
    } catch (e: any) {
      setErrorMessage(`Error: ${e.message || e}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadBuilding = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // Create local preview URL
      const objectUrl = URL.createObjectURL(file);
      setBgImageUrl(objectUrl);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/buildings/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setBuildingData(data.building);
        if (data.world_state) {
          setWorldState(data.world_state);
        }
        setAgentActions([]);
        setSelectedZoneId(null);
      } else {
        const err = await res.text();
        setErrorMessage(`Upload failed: ${err}`);
      }
    } catch (e: any) {
      setErrorMessage(`Upload error: ${e.message || e}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const startIncident = async (zoneId: string) => {
    try {
      await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: zoneId,
          hazard_type: 'fire',
          severity: 0.9
        })
      });
    } catch (e) {
      console.error('Failed to start incident:', e);
    }
  };

  const clearIncidents = async () => {
    try {
      await fetch('/api/incidents', { method: 'DELETE' });
      setAgentActions([]);
    } catch (e) {
      console.error('Failed to clear incidents:', e);
    }
  };

  const resetBuilding = async () => {
    try {
      await fetch('/api/incidents', { method: 'DELETE' });
      setAgentActions([]);
      setSelectedZoneId(null);
    } catch (e) {
      console.error('Failed to reset building:', e);
    }
  };

  const updateOccupancy = async (zoneId: string, delta: number) => {
    try {
      await fetch('/api/occupancy/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: zoneId,
          delta: delta
        })
      });
    } catch (e) {
      console.error('Failed to update occupancy:', e);
    }
  };

  const toggleSensor = async (zoneId: string, sensorType: string, isCurrentlyOnline: boolean) => {
    try {
      const endpoint = isCurrentlyOnline ? '/api/sensors/fail' : '/api/sensors/restore';
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: zoneId,
          sensor_type: sensorType
        })
      });
    } catch (e) {
      console.error('Failed to toggle sensor:', e);
    }
  };

  // Fetch initial building if available on startup
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const res = await fetch('/api/buildings/current');
        if (res.ok) {
          const data = await res.json();
          if (data.building) {
            setBuildingData(data.building);
          }
          if (data.state) {
            setWorldState(data.state);
          }
        }
      } catch {
        // Backend building not yet loaded
      }
    };
    fetchCurrent();
  }, []);

  const activeIncidentsCount = worldState?.incidents ? worldState.incidents.filter(i => i.active).length : 0;
  const buildingName = buildingData ? `Building (${buildingData.zones.length} zones)` : null;
  const selectedZone = (worldState?.zones && selectedZoneId) ? worldState.zones[selectedZoneId] : null;
  const selectedZoneDirective = (worldState?.evacuation_directives && selectedZoneId) ? worldState.evacuation_directives[selectedZoneId] : null;
  const zonesList = buildingData?.zones ? buildingData.zones.map(z => z.id) : (worldState?.zones ? Object.keys(worldState.zones) : []);

  const latestBroadcast = worldState?.active_broadcasts && worldState.active_broadcasts.length > 0 ? worldState.active_broadcasts[0] : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      <Header 
        connected={connected} 
        activeIncidentsCount={activeIncidentsCount} 
        buildingName={buildingName} 
      />
      
      <StatsBar 
        worldState={worldState} 
        buildingData={buildingData} 
      />

      {/* Live Emergency PA Voice Broadcast Banner */}
      {activeIncidentsCount > 0 && latestBroadcast && (
        <div className="bg-red-950/90 border-b border-red-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-red-200 backdrop-blur z-20 shadow-lg">
          <div className="flex items-center space-x-3 overflow-hidden">
            <span className="flex items-center px-2 py-0.5 rounded bg-red-600 text-white font-mono font-black animate-pulse text-[10px] tracking-wider shrink-0">
              🚨 PA DIRECTIVE
            </span>
            <span className="font-bold text-red-100 shrink-0">{latestBroadcast.headline}:</span>
            <span className="text-red-200 truncate">{latestBroadcast.instruction}</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0 ml-4">
            <button
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  const utt = new SpeechSynthesisUtterance(`${latestBroadcast.headline}. ${latestBroadcast.instruction}`);
                  utt.rate = 1.05;
                  window.speechSynthesis.speak(utt);
                }
              }}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-all shadow active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Play PA Audio</span>
            </button>
          </div>
        </div>
      )}

      {/* Error / Processing Toast Banner */}
      {errorMessage && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-2 text-xs text-red-400 font-medium flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-300 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {isProcessing && (
        <div className="bg-blue-500/10 border-b border-blue-500/30 px-6 py-2 text-xs text-blue-300 font-medium flex items-center space-x-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Vision AI analyzing architectural layout and provisioning virtual sensor digital twin...</span>
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Floorplan Canvas Center */}
        <div className="flex-1 relative min-w-0 bg-slate-950">
          <FloorPlanCanvas 
            buildingData={buildingData}
            worldState={worldState}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            bgImageUrl={bgImageUrl}
          />
        </div>
        
        {/* Right Telemetry & Agent Sidebar */}
        <div className="w-[420px] flex flex-col border-l border-slate-800 bg-slate-900 shrink-0">
          <div className="h-[55%] flex flex-col min-h-0">
            <ZoneInspector 
              zone={selectedZone}
              directive={selectedZoneDirective}
              onUpdateOccupancy={updateOccupancy}
              onToggleSensor={toggleSensor}
              onStartIncident={startIncident}
            />
          </div>
          <div className="h-[45%] flex flex-col min-h-0 border-t border-slate-800">
            <IncidentFeed actions={agentActions} />
          </div>
        </div>
      </div>
      
      <IncidentControl 
        onStartIncident={startIncident}
        onClearIncidents={clearIncidents}
        onResetBuilding={resetBuilding}
        onLoadDemo={loadDemo}
        onUpload={uploadBuilding}
        currentBuilding={buildingData}
        zones={zonesList}
      />
    </div>
  );
}

export default App;
