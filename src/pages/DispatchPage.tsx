import { useState, useMemo } from 'react';
import { useDelivery } from '@/contexts/DeliveryContext';
import { DEPOT_POSITION, type Order, type RouteStop } from '@/data/sampleData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Truck, Clock, MapPin, Package, ChevronRight, CheckCircle2,
  Navigation, Route, Sparkles, Layers, Plus, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Cutoff helpers ──────────────────────────────────────────────────────────
function getDeliveryDayLabel(createdAt: string): 'Same Day' | 'Next Day' | 'Check Cutoff' {
  const hour = new Date(createdAt).getHours();
  if (hour < 11) return 'Same Day';
  if (hour >= 14) return 'Next Day';
  return 'Check Cutoff';
}

// ── k-means clustering ───────────────────────────────────────────────────────
function kmeans(orders: Order[], k: number): Order[][] {
  if (orders.length === 0) return [];
  k = Math.min(k, orders.length);

  // Spread initial centroids by picking maximally distant points
  const used = new Set<number>();
  const centroids: { x: number; y: number }[] = [];
  // Start with the order furthest from depot
  let maxDist = -1; let seed = 0;
  orders.forEach((o, i) => {
    const d = Math.hypot((o.clientX ?? 50) - DEPOT_POSITION.x, (o.clientY ?? 50) - DEPOT_POSITION.y);
    if (d > maxDist) { maxDist = d; seed = i; }
  });
  centroids.push({ x: orders[seed].clientX ?? 50, y: orders[seed].clientY ?? 50 });
  used.add(seed);

  // Each subsequent centroid is the farthest from existing centroids
  while (centroids.length < k) {
    let best = -1; let bestDist = -1;
    orders.forEach((o, i) => {
      if (used.has(i)) return;
      const minC = Math.min(...centroids.map(c =>
        Math.hypot((o.clientX ?? 50) - c.x, (o.clientY ?? 50) - c.y)
      ));
      if (minC > bestDist) { bestDist = minC; best = i; }
    });
    if (best === -1) break;
    centroids.push({ x: orders[best].clientX ?? 50, y: orders[best].clientY ?? 50 });
    used.add(best);
  }

  // Iterate assignment + centroid update
  let clusters: Order[][] = Array.from({ length: centroids.length }, () => []);
  for (let iter = 0; iter < 8; iter++) {
    clusters = Array.from({ length: centroids.length }, () => []);
    orders.forEach(o => {
      const ox = o.clientX ?? 50; const oy = o.clientY ?? 50;
      let best = 0; let bestD = Infinity;
      centroids.forEach((c, i) => {
        const d = Math.hypot(ox - c.x, oy - c.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      clusters[best].push(o);
    });
    // Update centroids
    clusters.forEach((cl, i) => {
      if (cl.length === 0) return;
      centroids[i].x = cl.reduce((s, o) => s + (o.clientX ?? 50), 0) / cl.length;
      centroids[i].y = cl.reduce((s, o) => s + (o.clientY ?? 50), 0) / cl.length;
    });
  }
  return clusters.filter(c => c.length > 0);
}

// ── Zone label from centroid position ───────────────────────────────────────
function zoneLabel(cx: number, cy: number): string {
  const ns = cy < 45 ? 'North' : cy > 65 ? 'South' : 'Central';
  const ew = cx < 35 ? ' West' : cx > 65 ? ' East' : '';
  return ns + ew;
}

const CLUSTER_COLORS = [
  { dot: 'hsl(221 83% 53%)', bg: 'hsl(221 83% 53% / 0.08)', border: 'hsl(221 83% 53% / 0.3)', text: 'hsl(221 83% 53%)' },
  { dot: 'hsl(0 72% 51%)',   bg: 'hsl(0 72% 51% / 0.08)',   border: 'hsl(0 72% 51% / 0.3)',   text: 'hsl(0 72% 51%)' },
  { dot: 'hsl(142 71% 40%)', bg: 'hsl(142 71% 40% / 0.08)', border: 'hsl(142 71% 40% / 0.3)', text: 'hsl(142 71% 40%)' },
  { dot: 'hsl(38 92% 45%)',  bg: 'hsl(38 92% 45% / 0.08)',  border: 'hsl(38 92% 45% / 0.3)',  text: 'hsl(38 92% 45%)' },
];

// ── Shared SVG helpers ───────────────────────────────────────────────────────
const STOP_POSITIONS: { x: number; y: number }[] = [
  { x: 30, y: 48 }, { x: 52, y: 26 }, { x: 70, y: 38 },
  { x: 82, y: 60 }, { x: 60, y: 72 }, { x: 42, y: 62 },
  { x: 68, y: 18 }, { x: 85, y: 36 }, { x: 48, y: 82 },
];

// ── Mini cluster map ──────────────────────────────────────────────────────────
function ClusterMiniMap({
  cluster,
  allOrders,
  color,
  h = 120,
}: {
  cluster: Order[];
  allOrders: Order[];
  color: string;
  h?: number;
}) {
  const toX = (x: number) => (x / 100) * 240;
  const toY = (y: number) => (y / 100) * h;
  const depot = DEPOT_POSITION;

  const pts = [depot, ...cluster.map(o => ({ x: o.clientX ?? 50, y: o.clientY ?? 50 }))];
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x)} ${toY(p.y)}`).join(' ');

  return (
    <svg viewBox={`0 0 240 ${h}`} className="w-full rounded"
      style={{ background: 'hsl(220 14% 97%)' }}>
      {/* Grid */}
      {[0.25, 0.5, 0.75].map(f => (
        <g key={f}>
          <line x1={toX(f * 100)} y1={0} x2={toX(f * 100)} y2={h}
            stroke="hsl(220 14% 91%)" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={0} y1={toY(f * 100)} x2={240} y2={toY(f * 100)}
            stroke="hsl(220 14% 91%)" strokeWidth="0.5" strokeDasharray="3 3" />
        </g>
      ))}

      {/* All orders as faint gray dots */}
      {allOrders.map(o => (
        <circle key={o.id}
          cx={toX(o.clientX ?? 50)} cy={toY(o.clientY ?? 50)} r={4}
          fill="hsl(220 14% 82%)" opacity={0.6}
        />
      ))}

      {/* Route path */}
      {cluster.length > 0 && (
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5"
          strokeDasharray="5 3" opacity="0.7" />
      )}

      {/* Depot */}
      <rect x={toX(depot.x) - 6} y={toY(depot.y) - 6} width={12} height={12}
        rx={2} fill="hsl(221 83% 53%)" />
      <text x={toX(depot.x)} y={toY(depot.y) + 4} textAnchor="middle"
        fontSize="6" fill="white" fontWeight="bold">W</text>

      {/* Cluster stops */}
      {cluster.map((o, i) => (
        <g key={o.id}>
          <circle cx={toX(o.clientX ?? 50)} cy={toY(o.clientY ?? 50)} r={9} fill={color} />
          <text x={toX(o.clientX ?? 50)} y={toY(o.clientY ?? 50) + 4}
            textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Route builder map (shows all orders + selected highlighted) ──────────────
function BuilderMap({
  allOrders,
  selectedIds,
  stops,
}: {
  allOrders: Order[];
  selectedIds: string[];
  stops: RouteStop[];
}) {
  const toX = (x: number) => (x / 100) * 500;
  const toY = (y: number) => (y / 100) * 240;
  const depot = DEPOT_POSITION;

  const pathD = stops.length > 0
    ? [depot, ...stops.map(s => ({ x: s.x, y: s.y }))]
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x)} ${toY(p.y)}`)
        .join(' ')
    : '';

  return (
    <svg viewBox="0 0 500 240" className="w-full rounded-lg"
      style={{ background: 'hsl(220 14% 96%)' }}>
      {/* Grid */}
      {[0.2, 0.4, 0.6, 0.8].map(f => (
        <g key={f}>
          <line x1={toX(f * 100)} y1={0} x2={toX(f * 100)} y2={240}
            stroke="hsl(220 14% 89%)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={0} y1={toY(f * 100)} x2={500} y2={toY(f * 100)}
            stroke="hsl(220 14% 89%)" strokeWidth="1" strokeDasharray="4 4" />
        </g>
      ))}

      {/* All unselected orders — gray dots */}
      {allOrders.filter(o => !selectedIds.includes(o.id)).map(o => (
        <g key={o.id}>
          <circle cx={toX(o.clientX ?? 50)} cy={toY(o.clientY ?? 50)} r={10}
            fill="hsl(220 14% 78%)" />
          <text x={toX(o.clientX ?? 50)} y={toY(o.clientY ?? 50) + 4}
            textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
            {o.orderNumber.slice(-3)}
          </text>
        </g>
      ))}

      {/* Route path */}
      {pathD && (
        <path d={pathD} fill="none" stroke="hsl(221 83% 53%)" strokeWidth="2"
          strokeDasharray="6 3" opacity="0.7" />
      )}

      {/* Depot */}
      <rect x={toX(depot.x) - 12} y={toY(depot.y) - 12} width={24} height={24}
        rx={4} fill="hsl(221 83% 53%)" />
      <text x={toX(depot.x)} y={toY(depot.y) + 5} textAnchor="middle"
        fontSize="10" fill="white" fontWeight="bold">W</text>

      {/* Selected stops — colored */}
      {stops.map(stop => (
        <g key={stop.orderId}>
          <circle cx={toX(stop.x)} cy={toY(stop.y)} r={13}
            fill="hsl(0 72% 51%)" />
          <text x={toX(stop.x)} y={toY(stop.y) + 5} textAnchor="middle"
            fontSize="10" fill="white" fontWeight="bold">
            {stop.stopNumber}
          </text>
        </g>
      ))}

      {/* Legend */}
      <circle cx={8} cy={8} r={5} fill="hsl(220 14% 78%)" />
      <text x={16} y={12} fontSize="8" fill="hsl(220 9% 46%)">Available</text>
      <circle cx={60} cy={8} r={5} fill="hsl(0 72% 51%)" />
      <text x={68} y={12} fontSize="8" fill="hsl(220 9% 46%)">Selected</text>
      <rect x={110} y={3} width={10} height={10} rx={1} fill="hsl(221 83% 53%)" />
      <text x={123} y={12} fontSize="8" fill="hsl(220 9% 46%)">Depot</text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DispatchPage() {
  const { orders, couriers, deliveryRuns, createDeliveryRun, deleteDeliveryRun } = useDelivery();

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [loadedGroupIdx, setLoadedGroupIdx] = useState<number | null>(null);

  const dispatchableOrders = useMemo(() => orders.filter(o => o.status === 'New'), [orders]);
  const activeCouriers = couriers.filter(c => !c.isDeactivated);
  const selectedDriver = activeCouriers.find(c => c.id === selectedDriverId);

  // ── Smart clustering ─────────────────────────────────────────────────────
  const numClusters = useMemo(() => {
    if (dispatchableOrders.length <= 3) return 1;
    if (dispatchableOrders.length <= 6) return 2;
    return 3;
  }, [dispatchableOrders.length]);

  const suggestedClusters = useMemo(
    () => kmeans(dispatchableOrders, numClusters),
    [dispatchableOrders, numClusters]
  );

  // ── Builder helpers ─────────────────────────────────────────────────────
  const toggleOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setLoadedGroupIdx(null);
  };

  const loadCluster = (idx: number) => {
    setSelectedOrderIds(suggestedClusters[idx].map(o => o.id));
    setLoadedGroupIdx(idx);
    setShowBuilder(true);
  };

  const buildStops = (): RouteStop[] =>
    selectedOrderIds.map((id, i) => {
      const order = orders.find(o => o.id === id)!;
      return {
        stopNumber: i + 1,
        orderId: id,
        clientName: order.clientName,
        clientAddress: order.clientAddress,
        estimatedArrival: `${(10 + i).toString().padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
        status: 'pending',
        x: order.clientX ?? STOP_POSITIONS[i]?.x ?? 50,
        y: order.clientY ?? STOP_POSITIONS[i]?.y ?? 50,
      };
    });

  const handleCreateRun = () => {
    if (!selectedDriverId || selectedOrderIds.length === 0) return;
    const driver = activeCouriers.find(c => c.id === selectedDriverId)!;
    const stops = buildStops();
    createDeliveryRun({
      runNumber: `RUN-${Date.now().toString().slice(-6)}`,
      driverId: driver.id,
      driverName: driver.name,
      vehiclePlate: driver.vehiclePlate ?? '—',
      vehicleModel: driver.vehicleModel ?? '—',
      date: new Date().toISOString().split('T')[0],
      stops,
      status: 'Planned',
      estimatedDuration: `${Math.ceil(stops.length * 1.2)}h 00m`,
    });
    setSelectedOrderIds([]);
    setSelectedDriverId('');
    setShowBuilder(false);
    setLoadedGroupIdx(null);
  };

  const previewStops = buildStops();
  const canCreate = selectedDriverId && selectedOrderIds.length > 0;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dispatch & Route Planning</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {deliveryRuns.length} run(s) today · {dispatchableOrders.length} orders awaiting dispatch
          </p>
        </div>
        <Button
          onClick={() => setShowBuilder(!showBuilder)}
          className="bg-primary hover:bg-primary/90 gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New Dispatch Run
        </Button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SMART ROUTE SUGGESTIONS
      ════════════════════════════════════════════════════════════════ */}
      {dispatchableOrders.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Smart Route Suggestions</h3>
              <p className="text-xs text-muted-foreground">
                Orders grouped by geographic proximity — assign each group to a driver
              </p>
            </div>
            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 h-4 border-primary/30 text-primary bg-primary/5">
              {suggestedClusters.length} groups
            </Badge>
          </div>

          {/* Cluster cards */}
          <div className={cn(
            'grid gap-4',
            suggestedClusters.length === 1 ? 'grid-cols-1' :
            suggestedClusters.length === 2 ? 'grid-cols-2' :
            'grid-cols-3'
          )}>
            {suggestedClusters.map((cluster, idx) => {
              const col = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
              const cx = cluster.reduce((s, o) => s + (o.clientX ?? 50), 0) / cluster.length;
              const cy = cluster.reduce((s, o) => s + (o.clientY ?? 50), 0) / cluster.length;
              const zone = zoneLabel(cx, cy);
              const total = cluster.reduce((s, o) => s + o.total, 0);
              const isLoaded = loadedGroupIdx === idx;

              // Estimate route distance (sum of sequential distances from depot)
              const routePts = [DEPOT_POSITION, ...cluster.map(o => ({ x: o.clientX ?? 50, y: o.clientY ?? 50 }))];
              const routeDist = routePts.slice(1).reduce((sum, p, i) => {
                const prev = routePts[i];
                return sum + Math.hypot(p.x - prev.x, p.y - prev.y);
              }, 0);

              return (
                <div
                  key={idx}
                  className={cn(
                    'rounded-xl border p-3 space-y-3 transition-all',
                    isLoaded
                      ? 'ring-2 ring-offset-1'
                      : 'border-border hover:border-border/80'
                  )}
                  style={isLoaded ? {
                    borderColor: col.dot,
                    // @ts-ignore
                    '--tw-ring-color': col.dot,
                    background: col.bg,
                  } : {}}
                >
                  {/* Group header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: col.dot }}>
                        <span className="text-[9px] text-white font-bold">{String.fromCharCode(65 + idx)}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        Group {String.fromCharCode(65 + idx)} — {zone}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      ~{Math.round(routeDist * 0.5)} km route
                    </span>
                  </div>

                  {/* Mini map */}
                  <ClusterMiniMap
                    cluster={cluster}
                    allOrders={dispatchableOrders}
                    color={col.dot}
                  />

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {cluster.length} orders
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {new Set(cluster.map(o => o.clientName)).size} clients
                    </span>
                    <span className="font-medium text-foreground ml-auto">
                      ${total.toFixed(0)}
                    </span>
                  </div>

                  {/* Order chips */}
                  <div className="flex flex-wrap gap-1">
                    {cluster.map(o => {
                      const dayLabel = getDeliveryDayLabel(o.createdAt);
                      return (
                        <div key={o.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px]"
                          style={{ borderColor: col.border, background: col.bg, color: col.text }}>
                          <span className="font-mono font-semibold">{o.orderNumber.slice(-3)}</span>
                          <span className={cn(
                            'text-[8px] px-1 py-0 rounded-full font-semibold',
                            dayLabel === 'Same Day' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          )}>
                            {dayLabel === 'Same Day' ? 'SD' : 'ND'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  <Button
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5"
                    style={{ background: col.dot }}
                    onClick={() => loadCluster(idx)}
                  >
                    {isLoaded
                      ? <><CheckCircle2 className="h-3.5 w-3.5" /> Group Loaded</>
                      : <><Layers className="h-3.5 w-3.5" /> Load This Group</>}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          RUN BUILDER
      ════════════════════════════════════════════════════════════════ */}
      {showBuilder && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <Route className="h-4 w-4 text-primary" />
              Configure Dispatch Run
              {selectedOrderIds.length > 0 && (
                <span className="text-primary">({selectedOrderIds.length} orders selected)</span>
              )}
            </h3>
            <button
              onClick={() => setShowBuilder(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Collapse
            </button>
          </div>

          {/* Map + order list side by side */}
          <div className="grid lg:grid-cols-2 gap-5">

            {/* Left: order map + checklist */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                All Available Orders — select to include
              </p>

              {/* Builder map — all orders as dots */}
              <BuilderMap
                allOrders={dispatchableOrders}
                selectedIds={selectedOrderIds}
                stops={previewStops}
              />

              {/* Order checklist */}
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {dispatchableOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No orders available for dispatch
                  </p>
                ) : dispatchableOrders.map(order => {
                  const dayLabel = getDeliveryDayLabel(order.createdAt);
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <label
                      key={order.id}
                      className={cn(
                        'flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:bg-accent/40'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOrder(order.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{order.orderNumber}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4',
                              dayLabel === 'Same Day'
                                ? 'border-green-500/40 text-green-600 bg-green-500/10'
                                : dayLabel === 'Next Day'
                                ? 'border-amber-500/40 text-amber-600 bg-amber-500/10'
                                : 'border-orange-400/40 text-orange-600 bg-orange-400/10'
                            )}
                          >
                            {dayLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {order.clientName} · {order.clientAddress}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {order.packages?.length ?? 1} pkg(s)
                          </span>
                          {order.deliveryTime && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {order.deliveryTime}
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-foreground ml-auto">
                            ${order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Right: driver + route preview */}
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Assign Driver & Vehicle
                </p>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Select driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCouriers.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.name}</span>
                          {c.vehiclePlate && (
                            <span className="text-xs text-muted-foreground">
                              {c.vehiclePlate} · {c.vehicleModel}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedDriver && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                    <Truck className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedDriver.vehicleModel}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedDriver.vehiclePlate}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-muted-foreground">{selectedDriver.ordersCompleted} deliveries</p>
                      <p className="text-xs text-green-600 font-medium">{selectedDriver.successRate}% success</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stop sequence */}
              {previewStops.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-primary" />
                    Planned Route — {previewStops.length} stops
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                      <div className="w-5 h-5 rounded bg-primary/80 flex items-center justify-center shrink-0">
                        <span className="text-[8px] text-white font-bold">W</span>
                      </div>
                      <span className="text-foreground font-medium">Warehouse (Depot)</span>
                    </div>
                    {previewStops.map(stop => (
                      <div key={stop.orderId} className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                        <span className="w-5 h-5 rounded-full bg-[hsl(0,72%,51%)] text-white font-bold flex items-center justify-center text-[9px] shrink-0">
                          {stop.stopNumber}
                        </span>
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate flex-1">{stop.clientName} — {stop.clientAddress}</span>
                        <span className="shrink-0 text-[10px]">~{stop.estimatedArrival}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateRun}
                disabled={!canCreate}
                className="w-full bg-primary hover:bg-primary/90 gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Create Dispatch Run
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ACTIVE RUNS
      ════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Today's Runs — {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </h3>

        {deliveryRuns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            No dispatch runs yet. Use a Smart Group suggestion above or create one manually.
          </div>
        ) : (
          <div className="grid gap-4">
            {deliveryRuns.map(run => {
              const isActive = activeRunId === run.id;
              const completedStops = run.stops.filter(s => s.status === 'completed').length;
              const pct = run.stops.length > 0 ? Math.round((completedStops / run.stops.length) * 100) : 0;

              return (
                <div key={run.id}
                  className={cn('rounded-xl border transition-colors',
                    isActive ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'
                  )}>
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setActiveRunId(isActive ? null : run.id)}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                      run.status === 'In Progress' ? 'bg-blue-500/10' :
                      run.status === 'Completed'   ? 'bg-green-500/10' : 'bg-secondary'
                    )}>
                      <Truck className={cn('h-5 w-5',
                        run.status === 'In Progress' ? 'text-blue-500' :
                        run.status === 'Completed'   ? 'text-green-500' : 'text-muted-foreground'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{run.runNumber}</span>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 h-4',
                          run.status === 'In Progress' ? 'border-blue-400/40 text-blue-500 bg-blue-500/10' :
                          run.status === 'Completed'   ? 'border-green-400/40 text-green-500 bg-green-500/10' :
                                                         'border-border text-muted-foreground'
                        )}>
                          {run.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {run.driverName} · <span className="font-mono">{run.vehiclePlate}</span> · {run.vehicleModel}
                      </p>
                    </div>

                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-sm font-medium text-foreground">{run.stops.length} stops</p>
                      <p className="text-xs text-muted-foreground">{run.estimatedDuration}</p>
                    </div>

                    <div className="w-24 hidden md:block">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{completedStops}/{run.stops.length}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all',
                            run.status === 'Completed' ? 'bg-green-500' : 'bg-primary')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {isActive
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>

                  {isActive && (
                    <div className="border-t border-border p-4 grid lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route Map</p>
                        {/* Reuse BuilderMap in read-only mode */}
                        <BuilderMap
                          allOrders={[]}
                          selectedIds={run.stops.map(s => s.orderId)}
                          stops={run.stops.map(s => ({ ...s }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stop Sequence</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
                              <span className="text-[9px] text-white font-bold">W</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">Warehouse (Depot)</p>
                              <p className="text-[10px] text-muted-foreground">Departure point</p>
                            </div>
                          </div>
                          {run.stops.map(stop => (
                            <div key={stop.orderId} className={cn(
                              'flex items-center gap-3 p-2 rounded-lg border',
                              stop.status === 'completed' ? 'border-green-400/30 bg-green-500/5' : 'border-border bg-card'
                            )}>
                              <div className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white',
                                stop.status === 'completed' ? 'bg-green-500' : 'bg-[hsl(0,72%,51%)]'
                              )}>
                                {stop.stopNumber}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{stop.clientName}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{stop.clientAddress}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[10px] text-muted-foreground">~{stop.estimatedArrival}</p>
                                {stop.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 ml-auto mt-0.5" />}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full mt-2"
                          onClick={() => deleteDeliveryRun(run.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Run
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
