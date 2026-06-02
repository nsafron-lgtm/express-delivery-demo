import { useState } from 'react';
import { useDelivery } from '@/contexts/DeliveryContext';
import { DEPOT_POSITION, type DeliveryRun } from '@/data/sampleData';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle2, Clock, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

function LiveMapSVG({ runs, activeRunId }: { runs: DeliveryRun[]; activeRunId: string | null }) {
  const depot = DEPOT_POSITION;
  const toSvgX = (x: number) => (x / 100) * 620;
  const toSvgY = (y: number) => (y / 100) * 380;

  const runColors: Record<string, string> = {
    'run-1': 'hsl(0 72% 51%)',
    'run-2': 'hsl(221 83% 53%)',
    'run-3': 'hsl(142 71% 45%)',
  };
  const defaultColors = ['hsl(0 72% 51%)', 'hsl(221 83% 53%)', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)', 'hsl(280 60% 55%)'];
  const getColor = (run: DeliveryRun, idx: number) => runColors[run.id] ?? defaultColors[idx % defaultColors.length];
  const visibleRuns = activeRunId ? runs.filter(r => r.id === activeRunId) : runs;

  return (
    <svg viewBox="0 0 620 380" className="w-full h-full" style={{ background: 'hsl(220 14% 97%)' }}>
      {[0.2, 0.4, 0.6, 0.8].map(f => (
        <g key={f}>
          <line x1={toSvgX(f * 100)} y1={0} x2={toSvgX(f * 100)} y2={380} stroke="hsl(220 14% 90%)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={0} y1={toSvgY(f * 100)} x2={620} y2={toSvgY(f * 100)} stroke="hsl(220 14% 90%)" strokeWidth="1" strokeDasharray="4 4" />
        </g>
      ))}
      {[
        { x1: 0, y1: toSvgY(45), x2: 620, y2: toSvgY(45) },
        { x1: 0, y1: toSvgY(70), x2: 620, y2: toSvgY(70) },
        { x1: toSvgX(35), y1: 0, x2: toSvgX(35), y2: 380 },
        { x1: toSvgX(62), y1: 0, x2: toSvgX(62), y2: 380 },
      ].map((l, i) => (
        <line key={i} {...l} stroke="hsl(220 14% 85%)" strokeWidth="3" />
      ))}
      {visibleRuns.map((run, idx) => {
        const color = getColor(run, idx);
        const pts = [depot, ...run.stops.map(s => ({ x: s.x, y: s.y }))];
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y)}`).join(' ');
        return <path key={run.id} d={d} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="7 4" opacity={activeRunId && activeRunId !== run.id ? 0.2 : 0.8} />;
      })}
      <rect x={toSvgX(depot.x) - 16} y={toSvgY(depot.y) - 16} width={32} height={32} rx={5} fill="hsl(221 83% 53%)" />
      <text x={toSvgX(depot.x)} y={toSvgY(depot.y) + 6} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">W</text>
      <text x={toSvgX(depot.x)} y={toSvgY(depot.y) + 27} textAnchor="middle" fontSize="9" fill="hsl(221 83% 53%)" fontWeight="bold">DEPOT</text>
      {visibleRuns.map((run, idx) => {
        const color = getColor(run, idx);
        const dimmed = activeRunId && activeRunId !== run.id;
        return run.stops.map(stop => {
          const cx = toSvgX(stop.x); const cy = toSvgY(stop.y);
          const fill = stop.status === 'completed' ? 'hsl(142 71% 45%)' : color;
          return (
            <g key={`${run.id}-${stop.orderId}`} opacity={dimmed ? 0.2 : 1}>
              <circle cx={cx} cy={cy} r={16} fill={fill} />
              <text x={cx} y={cy + 6} textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">{stop.stopNumber}</text>
              <text x={cx} y={cy + 28} textAnchor="middle" fontSize="8" fill="hsl(220 9% 40%)" fontWeight="500">{stop.clientName.split(' ')[0]}</text>
            </g>
          );
        });
      })}
      {runs.map((run, idx) => {
        const color = getColor(run, idx);
        return (
          <g key={`leg-${run.id}`}>
            <rect x={8} y={8 + idx * 22} width={14} height={14} rx={3} fill={color} opacity={0.85} />
            <text x={26} y={19 + idx * 22} fontSize="9" fill="hsl(220 9% 46%)" fontWeight="500">{run.runNumber} · {run.driverName.split(' ')[0]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function MapPage() {
  const { deliveryRuns } = useDelivery();
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const activeRun = deliveryRuns.find(r => r.id === activeRunId) ?? null;
  const statusColor = (status: DeliveryRun['status']) =>
    status === 'In Progress' ? 'border-blue-400/40 text-blue-500 bg-blue-500/10'
    : status === 'Completed' ? 'border-green-400/40 text-green-500 bg-green-500/10'
    : 'border-border text-muted-foreground';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Live Tracking Map</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{deliveryRuns.length} active run(s) · click a run to highlight its route</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery Runs</p>
          {deliveryRuns.map(run => {
            const completed = run.stops.filter(s => s.status === 'completed').length;
            const isSelected = activeRunId === run.id;
            return (
              <button key={run.id} onClick={() => setActiveRunId(isSelected ? null : run.id)} className={cn('w-full text-left rounded-xl border p-4 transition-all space-y-3', isSelected ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border bg-card hover:bg-accent/40')}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{run.runNumber}</span>
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 h-4', statusColor(run.status))}>{run.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{run.driverName}</span>
                  <span className="font-mono shrink-0">{run.vehiclePlate}</span>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>{completed} of {run.stops.length} stops</span>
                    <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {run.estimatedDuration}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className={cn('h-full rounded-full', run.status === 'Completed' ? 'bg-green-500' : 'bg-primary')} style={{ width: `${run.stops.length > 0 ? Math.round((completed / run.stops.length) * 100) : 0}%` }} />
                  </div>
                </div>
                {run.status !== 'Completed' && (() => {
                  const next = run.stops.find(s => s.status === 'pending');
                  return next ? (
                    <div className="flex items-start gap-1.5 pt-1 border-t border-border">
                      <Navigation className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Next: Stop {next.stopNumber}</p>
                        <p className="text-[10px] font-medium text-foreground truncate">{next.clientAddress}</p>
                        <p className="text-[9px] text-muted-foreground">ETA ~{next.estimatedArrival}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </button>
            );
          })}
        </div>
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{activeRun ? `Route: ${activeRun.runNumber}` : 'All Active Routes'}</p>
          <div className="rounded-xl border border-border overflow-hidden" style={{ height: 380 }}>
            <LiveMapSVG runs={deliveryRuns} activeRunId={activeRunId} />
          </div>
          {activeRun && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{activeRun.runNumber} — Stop Sequence</p>
                <span className="text-xs text-muted-foreground">{activeRun.vehicleModel} · {activeRun.vehiclePlate}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {activeRun.stops.map(stop => (
                  <div key={stop.orderId} className={cn('flex items-center gap-2.5 p-2.5 rounded-lg border text-xs', stop.status === 'completed' ? 'border-green-400/30 bg-green-500/5' : 'border-border bg-secondary/30')}>
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0', stop.status === 'completed' ? 'bg-green-500' : 'bg-[hsl(0,72%,51%)]')}>{stop.stopNumber}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{stop.clientName}</p>
                      <p className="text-muted-foreground truncate text-[10px]">{stop.clientAddress}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-muted-foreground text-[10px]">{stop.estimatedArrival}</p>
                      {stop.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto mt-0.5" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
