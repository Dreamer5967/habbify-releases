import { ShieldAlert, Activity, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  activeIncidentsCount: number;
  buildingName: string | null;
}

export function Header({ connected, activeIncidentsCount, buildingName }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
          <ShieldAlert className={`w-5 h-5 ${activeIncidentsCount > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-black tracking-tight text-white">CrisisAgent</h1>
            <span className="text-[10px] uppercase font-bold font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">v1.0 Free Stack</span>
          </div>
          <p className="text-[11px] text-slate-400">Autonomous Emergency Response & Digital Twin Coordinator</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-5">
        {activeIncidentsCount > 0 ? (
          <div className="px-3.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full flex items-center space-x-2 shadow-sm shadow-red-500/20">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-red-400">{activeIncidentsCount} Active Fire Incident{activeIncidentsCount > 1 ? 's' : ''}</span>
          </div>
        ) : (
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Building Monitored • All Systems Normal</span>
          </div>
        )}
        
        <div className="text-xs font-semibold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-mono">
          {buildingName || 'No Floorplan'}
        </div>
        
        <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
          {connected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-medium font-mono">LIVE WS</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-400 font-mono">OFFLINE</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
