export type ZoneType = 'room' | 'corridor' | 'stair' | 'exit';
export type ZoneState = 'NORMAL' | 'ALERT' | 'CRITICAL' | 'UNOBSERVABLE' | 'EVACUATING' | 'DEGRADED';
export type SensorStatus = 'ONLINE' | 'FAILED' | 'DEGRADED';
export type ConnectionType = 'door' | 'open' | 'stairwell';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  centroid_x: number;
  centroid_y: number;
}

export interface Connection {
  from: string;
  to: string;
  type: ConnectionType;
}

export interface ZoneState_Full {
  zone_id: string;
  zone_type: ZoneType;
  name: string;
  hazard: string | null;
  hazard_probability: number;
  temperature: number;
  smoke: number;
  occupancy: number;
  sensor_status: Record<string, SensorStatus>;
  confidence: number;
  state: ZoneState;
  routes_available: string[];
  routes_blocked: string[];
  updated_at: string;
}

export interface EvacuationStep {
  step_num: number;
  from_zone: string;
  from_name: string;
  to_zone: string;
  to_name: string;
  action: string;
  instruction: string;
  warning?: string | null;
  connection_type?: string;
}

export interface EvacuationDirective {
  zone_id: string;
  zone_name: string;
  occupancy: number;
  status: 'SAFE' | 'CRITICAL_EVACUATION' | 'TRAPPED_SHELTER_IN_PLACE';
  target_exit_id: string | null;
  target_exit_name: string | null;
  estimated_time_seconds: number;
  path: string[];
  headline: string;
  voice_announcement: string;
  steps: EvacuationStep[];
  hazard_warnings: string[];
}

export interface BroadcastAnnouncement {
  id: number;
  zone_id: string;
  headline: string;
  instruction: string;
  level: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
  timestamp: string;
}

export interface WorldState {
  zones: Record<string, ZoneState_Full>;
  incidents: Incident[];
  evacuation_routes: Record<string, string[]>;
  evacuation_directives?: Record<string, EvacuationDirective>;
  active_broadcasts?: BroadcastAnnouncement[];
}

export interface Incident {
  id: number;
  zone_id: string;
  hazard_type: string;
  severity: number;
  started_at: string;
  active: boolean;
}

export interface AgentAction {
  id: number;
  incident_id: number | null;
  action: string;
  args: Record<string, any>;
  reason: string;
  triggered_by: string;
  created_at: string;
  result?: Record<string, any>;
}

export interface BuildingData {
  zones: Zone[];
  connections: Connection[];
  reachability?: { reachable: string[]; isolated: string[]; exits: string[] };
}

export interface WSMessage {
  type: 'world_state' | 'agent_action' | 'agent_error' | 'agent_analysis' | 'building_loaded' | 'incident_started';
  data?: any;
  [key: string]: any;
}
