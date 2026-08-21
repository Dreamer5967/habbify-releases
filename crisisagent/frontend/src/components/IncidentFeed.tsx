import { useRef, useEffect } from 'react';
import { AgentAction } from '../types';
import { Bot, Zap, Clock, MapPin, CheckCircle2 } from 'lucide-react';

interface IncidentFeedProps {
  actions: AgentAction[];
}

export function IncidentFeed({ actions }: IncidentFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [actions]);

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t border-slate-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
          <Bot className="w-4 h-4 mr-1.5 text-blue-400" />
          Explainable Agent Action Feed
        </h2>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
          {actions.length} logs
        </span>
      </div>
      
      <div ref={feedRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {actions.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-8 px-4">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-400 mb-1">Autonomous Loop Ready</p>
            <p>Load a floorplan and trigger a fire incident to observe the LLM agent reasoning in real time.</p>
          </div>
        ) : (
          actions.map((action, i) => {
            const isReplan = action.action === 'replan';
            const isMarkUnsafe = action.action === 'mark_zone_unsafe';
            const isAlarm = action.action === 'activate_alarm';

            return (
              <div 
                key={`${action.id || i}-${i}`} 
                className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      isReplan 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isMarkUnsafe
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : isAlarm
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {action.action.toUpperCase()}
                    </span>
                    {action.args?.zone_id && (
                      <span className="flex items-center text-[11px] font-mono text-slate-400 bg-slate-700/80 px-1.5 py-0.5 rounded">
                        <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
                        {action.args.zone_id}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-[10px] text-slate-500 font-mono">
                    <Clock className="w-3 h-3 mr-1" />
                    {action.created_at ? getTimeAgo(action.created_at) : 'now'}
                  </div>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2">
                  {action.reason}
                </p>
                
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-700/60 pt-1.5">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Trigger: <span className="text-slate-400 font-mono">{action.triggered_by}</span></span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
