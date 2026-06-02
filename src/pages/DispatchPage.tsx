import { useState, useMemo } from 'react';
import { useDelivery } from '@/contexts/DeliveryContext';
import { DEPOT_LATLNG, type Order } from '@/data/sampleData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Truck, Clock, MapPin, CheckCircle2, Circle, Sparkles, Plus,
  Navigation, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TRUCK_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ec4899', '#14b8a6'];
const UNASSIGNED_COLOR = '#94a3b8';
const DELIVERED_COLOR = '#22c55e';
const DEPOT_COLOR = '#ef4444';

// Map bounds for Dubai area (lat/lng to pixel conversion)
const MAP_BOUNDS = {
  north: 25.32,
  south: 25.05,
  west: 55.10,
  east: 55.45,
};

function latLngToPercent(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100;
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

// Simple k-means clustering
function kmeans(orders: Order[], k: number): Order[][] {
  if (orders.length === 0) return [];
  k = Math.min(k, orders.length);
  const pts = orders.map(o => ({ lat: o.lat ?? 25.2, lng: o.lng ?? 55.27 }));
  const centroids = [pts[0]];
  while (centroids.length < k) {
    let best = 0, bestDist = -1;
    pts.forEach((p, i) => {
      const minD = Math.min(...centroids.map(c => Math.hypot(p.lat - c.lat, p.lng - c.lng)));
      if (minD > bestDist) { bestDist = minD; best = i; }
    });
    centroids.push(pts[best]);
  }
  let clusters: Order[][] = Array.from({ length: k }, () => []);
  for (let iter = 0; iter < 10; iter++) {
    clusters = Array.from({ length: k }, () => []);
    orders.forEach((o, i) => {
      const p = pts[i];
      let best = 0, bestD = Infinity;
      centroids.forEach((c, ci) => {
        const d = Math.hypot(p.lat - c.lat, p.lng - c.lng);
        if (d < bestD) { bestD = d; best = ci; }
      });
      clusters[best].push(o);
    });
    clusters.forEach((cl, i) => {
      if (cl.length === 0) return;
      const indices = cl.map(o => orders.indexOf(o));
      centroids[i] = {
        lat: indices.reduce((s, idx) => s + pts[idx].lat, 0) / indices.length,
        lng: indices.reduce((s, idx) => s + pts[idx].lng, 0) / indices.length,
      };
    });
  }
  return clusters.filter(c => c.length > 0);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function DispatchPage() {
  const { orders, couriers, deliveryRuns, createDeliveryRun, confirmDelivery } = useDelivery();

  const pendingOrders = useMemo(() =>
    orders.filter(o => o.status === 'New' || o.status === 'Assigned'),
    [orders]
  );
  const newOrders = useMemo(() => orders.filter(o => o.status === 'New'), [orders]);

  const k = Math.max(2, Math.min(3, Math.ceil(newOrders.length / 4)));
  const suggestions = useMemo(() => kmeans(newOrders, k), [newOrders, k]);

  const [groupDriver, setGroupDriver] = useState<Record<number, string>>({});

  const runColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    deliveryRuns.forEach((r, i) => { map[r.id] = TRUCK_COLORS[i % TRUCK_COLORS.length]; });
    return map;
  }, [deliveryRuns]);

  function getOrderColor(order: Order) {
    if (order.status === 'Delivered') return DELIVERED_COLOR;
    if (order.courierId) {
      const run = deliveryRuns.find(r => r.driverId === order.courierId);
      if (run) return runColorMap[run.id] ?? UNASSIGNED_COLOR;
    }
    // Check which suggestion group this order belongs to
    for (let gi = 0; gi < suggestions.length; gi++) {
      if (suggestions[gi].some(o => o.id === order.id)) {
        return TRUCK_COLORS[gi % TRUCK_COLORS.length];
      }
    }
    return UNASSIGNED_COLOR;
  }

  function assignGroupToDriver(group: Order[], driverId: string) {
    const driver = couriers.find(c => c.id === driverId);
    if (!driver) return;
    const stops = group.map((o, i) => ({
      stopNumber: i + 1,
      orderId: o.id,
      clientName: o.clientName,
      clientAddress: o.clientAddress,
      estimatedArrival: '—',
      status: 'pending' as const,
      x: 50, y: 50,
    }));
    createDeliveryRun({
      runNumber: `RUN-${Date.now().toString().slice(-4)}`,
      driverId: driver.id,
      driverName: driver.name,
      vehiclePlate: driver.vehiclePlate ?? '—',
      vehicleModel: driver.vehicleModel ?? '—',
      date: new Date().toISOString().slice(0, 10),
      stops,
      status: 'Planned',
      estimatedDuration: `${Math.round(group.length * 0.75 * 10) / 10}h`,
    });
  }

  const activeDrivers = couriers.filter(c => !c.isDeactivated);

  // Depot position on map
  const depotPos = latLngToPercent(DEPOT_LATLNG[0], DEPOT_LATLNG[1]);

  // OpenStreetMap embed URL centered on Dubai
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BOUNDS.west}%2C${MAP_BOUNDS.south}%2C${MAP_BOUNDS.east}%2C${MAP_BOUNDS.north}&layer=mapnik`;

  return (
    <div className="flex flex-col bg-background -m-6" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-white">
        <div>
          <h1 className="text-lg font-semibold">Routes & Dispatch</h1>
          <p className="text-xs text-muted-foreground">
            {newOrders.length} new orders · {deliveryRuns.filter(r => r.status !== 'Completed').length} active runs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Badge>
        </div>
      </div>

      {/* Main body */}
      <div className="flex" style={{ height: 'calc(100vh - 120px)', minHeight: 500 }}>
        {/* LEFT: Smart groupings + pending list */}
        <div className="w-64 shrink-0 border-r bg-white flex flex-col" style={{ height: '100%', overflowY: 'auto' }}>
          <div className="p-3 space-y-3">

            {/* Smart suggestions */}
            {newOrders.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Smart Route Suggestions</span>
                </div>
                {suggestions.map((group, gi) => {
                  const color = TRUCK_COLORS[gi % TRUCK_COLORS.length];
                  const label = String.fromCharCode(65 + gi);
                  const clients = [...new Set(group.map(o => o.clientName))];
                  const estTime = `${Math.round(group.length * 0.75 * 10) / 10}h`;
                  return (
                    <div key={gi} className="rounded-lg border p-3 mb-2 bg-white" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: color }}>
                            {label}
                          </div>
                          <span className="text-xs font-semibold">Group {label}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] py-0">{group.length} stops</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1 truncate">
                        {clients.slice(0, 2).join(', ')}{clients.length > 2 ? ` +${clients.length - 2}` : ''}
                      </p>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        <Clock className="h-3 w-3 inline mr-0.5" />Est. {estTime} · {group.length} stops
                      </p>
                      <div className="flex items-center gap-2">
                        <Select value={groupDriver[gi] ?? ''} onValueChange={v => setGroupDriver(p => ({ ...p, [gi]: v }))}>
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue placeholder="Assign driver…" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeDrivers.map(d => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2"
                          disabled={!groupDriver[gi]}
                          onClick={() => {
                            if (groupDriver[gi]) assignGroupToDriver(group, groupDriver[gi]);
                          }}
                          style={{ background: groupDriver[gi] ? color : undefined }}
                        >
                          <Plus className="h-3 w-3 mr-1" />Run
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pending orders list */}
            {newOrders.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Unassigned Orders</p>
                {newOrders.map((o, idx) => {
                  const color = getOrderColor(o);
                  return (
                    <div key={o.id} className="flex items-start gap-2 py-1.5 border-b last:border-0">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5 shrink-0" style={{ background: color }}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{o.clientName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{o.clientAddress}</p>
                        <p className="text-[10px] text-muted-foreground">{o.orderNumber} · AED {o.total.toFixed(0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {newOrders.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-xs">All orders assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Map + Active Runs */}
        <div className="flex-1 flex flex-col">

          {/* Map with overlay dots */}
          <div className="flex-1 relative" style={{ minHeight: 300 }}>
            <iframe
              src={mapUrl}
              style={{ width: '100%', height: '100%', border: 0 }}
              allowFullScreen
              loading="eager"
              title="Dubai delivery map"
            />
            {/* SVG overlay with order dots */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Depot */}
              <circle
                cx={depotPos.x}
                cy={depotPos.y}
                r="1.2"
                fill={DEPOT_COLOR}
                stroke="white"
                strokeWidth="0.3"
              />
              <text x={depotPos.x} y={depotPos.y - 1.8} textAnchor="middle" fontSize="1.5" fill={DEPOT_COLOR} fontWeight="bold">
                DEPOT
              </text>

              {/* Route lines for active runs */}
              {deliveryRuns.map((run, ri) => {
                const color = runColorMap[run.id] ?? TRUCK_COLORS[ri % TRUCK_COLORS.length];
                const points: string[] = [];
                const dp = latLngToPercent(DEPOT_LATLNG[0], DEPOT_LATLNG[1]);
                points.push(`${dp.x},${dp.y}`);
                run.stops.forEach(stop => {
                  const order = orders.find(o => o.id === stop.orderId);
                  if (order?.lat && order?.lng) {
                    const p = latLngToPercent(order.lat, order.lng);
                    points.push(`${p.x},${p.y}`);
                  }
                });
                points.push(`${dp.x},${dp.y}`);
                return (
                  <polyline
                    key={run.id}
                    points={points.join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.3"
                    strokeDasharray="1 0.5"
                    opacity={0.7}
                  />
                );
              })}

              {/* Order dots */}
              {orders.filter(o => o.lat && o.lng).map((order, idx) => {
                const pos = latLngToPercent(order.lat!, order.lng!);
                const color = getOrderColor(order);
                const delivered = order.status === 'Delivered';
                const num = newOrders.findIndex(o => o.id === order.id) + 1;
                return (
                  <g key={order.id}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={delivered ? "0.9" : "1.3"}
                      fill={color}
                      stroke="white"
                      strokeWidth="0.25"
                      opacity={delivered ? 0.6 : 0.9}
                    />
                    {num > 0 && (
                      <text
                        x={pos.x}
                        y={pos.y + 0.5}
                        textAnchor="middle"
                        fontSize="1.2"
                        fill="white"
                        fontWeight="bold"
                      >
                        {num}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 bg-white/90 border rounded-lg px-3 py-2 text-[10px] space-y-1" style={{ zIndex: 20 }}>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: DEPOT_COLOR }} />
                <span>Warehouse / Depot</span>
              </div>
              {suggestions.map((_, gi) => (
                <div key={gi} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: TRUCK_COLORS[gi % TRUCK_COLORS.length] }} />
                  <span>Group {String.fromCharCode(65 + gi)}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: UNASSIGNED_COLOR }} />
                <span>Unassigned</span>
              </div>
            </div>
          </div>

          {/* Active Runs panel */}
          <div className="h-48 border-t bg-white overflow-hidden flex flex-col shrink-0">
            <div className="px-4 py-2 border-b flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wide">Active Runs</span>
              <span className="text-[11px] text-muted-foreground">
                {deliveryRuns.filter(r => r.status !== 'Completed').length} in progress
              </span>
            </div>
            <div className="flex gap-3 px-3 py-2 overflow-x-auto overflow-y-hidden flex-1">
              {deliveryRuns.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                  No runs created yet — assign a group above to create a run
                </div>
              )}
              {deliveryRuns.map((run, ri) => {
                const color = runColorMap[run.id] ?? TRUCK_COLORS[ri % TRUCK_COLORS.length];
                const completed = run.stops.filter(s => s.status === 'completed').length;
                return (
                  <div key={run.id} className="shrink-0 w-56 rounded-lg border bg-white overflow-hidden">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 border-b" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
                      <Truck className="h-3 w-3 shrink-0" style={{ color }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold truncate">{run.runNumber}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{run.driverName}</p>
                      </div>
                      <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0',
                        run.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        run.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        {run.status}
                      </span>
                    </div>
                    <div className="px-2.5 py-1 overflow-y-auto" style={{ maxHeight: 100 }}>
                      {run.stops.map(stop => {
                        const order = orders.find(o => o.id === stop.orderId);
                        const done = stop.status === 'completed';
                        const deliveredAt = stop.deliveredAt ?? order?.deliveredAt;
                        return (
                          <div key={stop.orderId} className={cn('flex items-start gap-1.5 py-1 border-b last:border-0', done && 'opacity-70')}>
                            {done
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                              : <Circle className="h-3.5 w-3.5 text-gray-300 mt-0.5 shrink-0" />
                            }
                            <div className="min-w-0">
                              <p className="text-[10px] font-medium truncate">{stop.clientName}</p>
                              {done && deliveredAt ? (
                                <p className="text-[9px] text-green-600 font-medium">Delivered {formatTime(deliveredAt)}</p>
                              ) : (
                                <p className="text-[9px] text-muted-foreground truncate">{stop.clientAddress}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
