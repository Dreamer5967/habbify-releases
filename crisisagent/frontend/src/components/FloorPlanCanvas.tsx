import { useMemo } from 'react';
import { BuildingData, WorldState } from '../types';

interface FloorPlanCanvasProps {
  buildingData: BuildingData | null;
  worldState: WorldState | null;
  selectedZoneId: string | null;
  onSelectZone: (id: string) => void;
  bgImageUrl?: string | null;
}

export function FloorPlanCanvas({ buildingData, worldState, selectedZoneId, onSelectZone, bgImageUrl }: FloorPlanCanvasProps) {
  if (!buildingData || !buildingData.zones || buildingData.zones.length === 0) {
    return (
      <div className="w-full h-full bg-slate-950 flex items-center justify-center border-r border-slate-800 p-8">
        <div className="text-center text-slate-500 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl">
            🏢
          </div>
          <p className="text-lg font-semibold text-slate-300 mb-2">No Floor Plan Loaded</p>
          <p className="text-sm text-slate-500 mb-6">
            Upload an architectural floor plan image or click &quot;Load Demo&quot; to test CrisisAgent with real-time digital twin telemetry.
          </p>
        </div>
      </div>
    );
  }

  // Normalize zone coordinates into a 1000 x 700 viewBox canvas
  const canvasWidth = 1000;
  const canvasHeight = 700;
  const paddingX = 80;
  const paddingY = 70;

  const normalizedZones = useMemo(() => {
    return buildingData.zones.map(z => {
      // If centroid_x/y is between 0 and 1, scale it; otherwise use raw coordinate with clamping
      const x = z.centroid_x <= 1.0 
        ? paddingX + z.centroid_x * (canvasWidth - paddingX * 2)
        : z.centroid_x;
      const y = z.centroid_y <= 1.0 
        ? paddingY + z.centroid_y * (canvasHeight - paddingY * 2)
        : z.centroid_y;
      return {
        ...z,
        canvasX: x,
        canvasY: y,
      };
    });
  }, [buildingData]);

  const zoneMap = useMemo(() => {
    const map = new Map<string, typeof normalizedZones[0]>();
    normalizedZones.forEach(z => map.set(z.id, z));
    return map;
  }, [normalizedZones]);

  const getZoneColor = (zoneId: string) => {
    if (!worldState || !worldState.zones[zoneId]) return '#475569';
    const state = worldState.zones[zoneId].state;
    switch(state) {
      case 'NORMAL': return '#10b981'; // crisis-safe green
      case 'ALERT': return '#f59e0b'; // amber
      case 'CRITICAL': return '#ef4444'; // red
      case 'EVACUATING': return '#3b82f6'; // blue
      case 'UNOBSERVABLE': return '#a855f7'; // purple
      case 'DEGRADED': return '#64748b'; // slate
      default: return '#475569';
    }
  };

  const getZonePulse = (zoneId: string) => {
    if (!worldState || !worldState.zones[zoneId]) return false;
    return worldState.zones[zoneId].state === 'CRITICAL';
  };

  const getHeatOpacity = (zoneId: string) => {
    if (!worldState || !worldState.zones[zoneId]) return 0;
    const prob = worldState.zones[zoneId].hazard_probability || 0;
    return Math.min(0.7, prob * 0.75);
  };

  // Extract all active evacuation paths as coordinate lists
  const activeEvacuationPaths = useMemo(() => {
    if (!worldState || !worldState.evacuation_routes) return [];
    const paths: { key: string; d: string }[] = [];

    Object.entries(worldState.evacuation_routes).forEach(([startZoneId, route]) => {
      if (!route || route.length < 2) return;
      const points = route
        .map(id => zoneMap.get(id))
        .filter((z): z is NonNullable<typeof z> => Boolean(z));

      if (points.length >= 2) {
        const d = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.canvasX} ${pt.canvasY}`, '');
        paths.push({ key: `evac-${startZoneId}`, d });
      }
    });

    return paths;
  }, [worldState, zoneMap]);

  return (
    <div className="w-full h-full bg-slate-950 border-r border-slate-800 relative overflow-hidden flex items-center justify-center p-4">
      {/* Legend & Status Badge */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3.5 z-10 text-xs shadow-2xl space-y-2.5">
        <div className="font-semibold text-slate-300 flex items-center justify-between">
          <span>Digital Twin Overlay</span>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-400">
          <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-500/50" /> Normal</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 shadow-sm shadow-amber-500/50" /> Alert</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 shadow-sm shadow-red-500/50" /> Critical (Fire)</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2 shadow-sm shadow-purple-500/50" /> Unobservable</div>
          <div className="flex items-center"><div className="w-4 h-1 rounded bg-emerald-400 mr-2" /> Evac Route</div>
          <div className="flex items-center"><div className="w-4 h-1 border-b border-dashed border-red-400 mr-2" /> Blocked Path</div>
        </div>
      </div>

      <svg 
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} 
        className="w-full h-full max-w-full max-h-full drop-shadow-2xl select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="fire-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="smoke-gradient">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
          {/* Directional Arrowhead Markers */}
          <marker id="arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
          </marker>
          <marker id="arrow-selected" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
          </marker>
        </defs>

        {/* Blueprint Floor Grid */}
        <g stroke="#1e293b" strokeWidth="1" opacity="0.4">
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`gx-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={canvasHeight} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`gy-${i}`} x1={0} y1={i * 50} x2={canvasWidth} y2={i * 50} />
          ))}
        </g>

        {/* Uploaded Floorplan Image Underlay */}
        {bgImageUrl && (
          <image
            href={bgImageUrl}
            x={paddingX}
            y={paddingY}
            width={canvasWidth - paddingX * 2}
            height={canvasHeight - paddingY * 2}
            preserveAspectRatio="xMidYMid meet"
            opacity="0.35"
            className="pointer-events-none rounded-xl"
          />
        )}

        {/* Base Connections / Corridors */}
        {buildingData.connections.map((conn, idx) => {
          const from = zoneMap.get(conn.from);
          const to = zoneMap.get(conn.to);
          if (!from || !to) return null;

          const fromState = worldState?.zones[conn.from];
          const toState = worldState?.zones[conn.to];
          const isBlocked = fromState?.state === 'CRITICAL' || toState?.state === 'CRITICAL' ||
                            fromState?.state === 'UNOBSERVABLE' || toState?.state === 'UNOBSERVABLE';

          return (
            <g key={`conn-${idx}`}>
              <line
                x1={from.canvasX}
                y1={from.canvasY}
                x2={to.canvasX}
                y2={to.canvasY}
                stroke={isBlocked ? '#ef4444' : '#334155'}
                strokeWidth={isBlocked ? 2 : 4}
                strokeDasharray={isBlocked ? '6,6' : 'none'}
                opacity={isBlocked ? 0.6 : 0.8}
              />
              {/* Door Indicator */}
              {conn.type === 'door' && (
                <circle 
                  cx={(from.canvasX + to.canvasX) / 2} 
                  cy={(from.canvasY + to.canvasY) / 2} 
                  r={3.5} 
                  fill="#64748b" 
                />
              )}
            </g>
          );
        })}

        {/* Active Evacuation Route Overlays with Directional Arrowheads */}
        {activeEvacuationPaths.map((path) => {
          const isSelectedPath = selectedZoneId && path.key === `evac-${selectedZoneId}`;
          return (
            <g key={path.key}>
              {/* Glowing underlay for selected zone */}
              {isSelectedPath && (
                <path
                  d={path.d}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.4"
                  className="animate-pulse"
                />
              )}
              <path
                d={path.d}
                fill="none"
                stroke={isSelectedPath ? '#34d399' : '#10b981'}
                strokeWidth={isSelectedPath ? '6' : '4.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="12 8"
                markerMid={isSelectedPath ? 'url(#arrow-selected)' : 'url(#arrow-green)'}
                markerEnd={isSelectedPath ? 'url(#arrow-selected)' : 'url(#arrow-green)'}
                className="animate-pulse"
                opacity="0.95"
              />
            </g>
          );
        })}

        {/* Zone Nodes */}
        {normalizedZones.map((zone) => {
          const isSelected = selectedZoneId === zone.id;
          const color = getZoneColor(zone.id);
          const isPulsing = getZonePulse(zone.id);
          const heatOpacity = getHeatOpacity(zone.id);
          const zoneState = worldState?.zones[zone.id];
          const occ = zoneState?.occupancy || 0;
          const isExit = zone.type === 'exit';
          const isStair = zone.type === 'stair';
          const isCorridor = zone.type === 'corridor';
          const size = isExit ? 32 : isStair ? 28 : isCorridor ? 26 : 36;

          return (
            <g
              key={`zone-${zone.id}`}
              transform={`translate(${zone.canvasX}, ${zone.canvasY})`}
              onClick={() => onSelectZone(zone.id)}
              className="cursor-pointer transition-all duration-200"
            >
              {/* Fire Heatmap / Smoke Fog Overlay */}
              {heatOpacity > 0 && (
                <circle
                  r={size * 2.8}
                  fill="#ef4444"
                  opacity={heatOpacity}
                  filter="url(#fire-glow)"
                />
              )}

              {/* Pulsing Fire Wave */}
              {isPulsing && (
                <circle
                  r={size * 1.5}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  className="animate-ping"
                  opacity="0.7"
                />
              )}

              {/* Node Geometry based on Zone Type */}
              {isExit ? (
                // Exit: Diamond badge with bold outline
                <polygon
                  points={`0,-${size} ${size},0 0,${size} -${size},0`}
                  fill={color}
                  stroke={isSelected ? '#ffffff' : '#0f172a'}
                  strokeWidth={isSelected ? 4 : 2.5}
                  className="drop-shadow-lg"
                />
              ) : isStair ? (
                // Stair: Rounded square
                <rect
                  x={-size / 2}
                  y={-size / 2}
                  width={size}
                  height={size}
                  rx={6}
                  fill={color}
                  stroke={isSelected ? '#ffffff' : '#0f172a'}
                  strokeWidth={isSelected ? 4 : 2}
                  className="drop-shadow-lg"
                />
              ) : isCorridor ? (
                // Corridor: Elongated pill
                <rect
                  x={-size}
                  y={-size / 2}
                  width={size * 2}
                  height={size}
                  rx={8}
                  fill={color}
                  stroke={isSelected ? '#ffffff' : '#0f172a'}
                  strokeWidth={isSelected ? 4 : 2}
                  className="drop-shadow-lg"
                />
              ) : (
                // Room: Circle
                <circle
                  r={size / 2}
                  fill={color}
                  stroke={isSelected ? '#ffffff' : '#0f172a'}
                  strokeWidth={isSelected ? 4 : 2.5}
                  className="drop-shadow-lg"
                />
              )}

              {/* Zone Identifier Label */}
              <text
                y={isExit ? 4 : 4}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={isExit || isCorridor ? '12' : '13'}
                fontWeight="800"
                className="select-none pointer-events-none drop-shadow"
              >
                {zone.id}
              </text>

              {/* Zone Name Label Above Node */}
              <text
                y={-size / 2 - 8}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="11"
                fontWeight="600"
                className="select-none pointer-events-none drop-shadow"
              >
                {zone.name}
              </text>

              {/* Live Sensor Metrics (Temp / Smoke) Mini Badge */}
              {zoneState && (
                <text
                  y={size / 2 + 14}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  className="select-none pointer-events-none"
                >
                  {zoneState.temperature.toFixed(0)}°C | {zoneState.smoke.toFixed(0)}%
                </text>
              )}

              {/* Occupant Badge (Top-Right of Node) */}
              {occ > 0 && (
                <g transform={`translate(${size / 2 + 4}, -${size / 2 + 4})`}>
                  <circle r={9} fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
                  <text
                    y={3.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="800"
                    className="select-none pointer-events-none"
                  >
                    {occ}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
