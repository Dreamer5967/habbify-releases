import { WorldState, BuildingData } from '../types';
import { Map, AlertTriangle, Users, Activity, Route } from 'lucide-react';

interface StatsBarProps {
  worldState: WorldState | null;
  buildingData: BuildingData | null;
}

export function StatsBar({ worldState, buildingData }: StatsBarProps) {
  const totalZones = buildingData?.zones?.length || (worldState ? Object.keys(worldState.zones).length : 0);
  
  let activeHazards = 0;
  let peopleToEvacuate = 0;
  let onlineSensors = 0;
  let totalSensors = 0;
  
  if (worldState && worldState.zones) {
    Object.values(worldState.zones).forEach(zone => {
      if (zone.state === 'CRITICAL' || zone.state === 'ALERT') {
        activeHazards++;
      }
      if (zone.state !== 'NORMAL' && zone.state !== 'UNOBSERVABLE') {
        peopleToEvacuate += (zone.occupancy || 0);
      }
      
      if (zone.sensor_status) {
        Object.values(zone.sensor_status).forEach(status => {
          totalSensors++;
          if (status === 'ONLINE') onlineSensors++;
        });
      }
    });
  }

  const sensorHealth = totalSensors > 0 ? Math.round((onlineSensors / totalSensors) * 100) : 100;
  const activeRoutes = worldState?.evacuation_routes ? Object.keys(worldState.evacuation_routes).length : 0;

  const stats = [
    {
      label: 'Monitored Zones',
      value: totalZones.toString(),
      icon: Map,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Active Hazards',
      value: activeHazards.toString(),
      icon: AlertTriangle,
      color: activeHazards > 0 ? 'text-red-400' : 'text-slate-400',
      bgColor: activeHazards > 0 ? 'bg-red-500/10' : 'bg-slate-800',
    },
    {
      label: 'Personnel to Evacuate',
      value: peopleToEvacuate.toString(),
      icon: Users,
      color: peopleToEvacuate > 0 ? 'text-amber-400' : 'text-slate-400',
      bgColor: peopleToEvacuate > 0 ? 'bg-amber-500/10' : 'bg-slate-800',
    },
    {
      label: 'Sensor Health',
      value: `${sensorHealth}%`,
      icon: Activity,
      color: sensorHealth < 100 ? 'text-purple-400' : 'text-emerald-400',
      bgColor: sensorHealth < 100 ? 'bg-purple-500/10' : 'bg-emerald-500/10',
    },
    {
      label: 'Evacuation Routes',
      value: activeRoutes.toString(),
      icon: Route,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    }
  ];

  return (
    <div className="grid grid-cols-5 gap-3 px-6 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="flex items-center p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-sm">
            <div className={`p-2.5 rounded-lg mr-3 ${stat.bgColor}`}>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">{stat.label}</p>
              <p className={`text-lg font-black font-mono ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
