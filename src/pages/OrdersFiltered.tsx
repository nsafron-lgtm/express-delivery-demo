import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDelivery } from '@/contexts/DeliveryContext';
import { OrdersTable } from '@/components/OrdersTable';
import type { Order, OrderStatus } from '@/data/sampleData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, Route } from 'lucide-react';

// ── Cutoff logic ─────────────────────────────────────────────────────────────
type CutoffLabel = 'Same Day' | 'Check Cutoff' | 'Next Day';

function getCutoff(order: Order): CutoffLabel {
  // Dubai is UTC+4; cutoff is 11 AM and 2 PM local time
  const hDubai = (new Date(order.createdAt).getUTCHours() + 4) % 24;
  if (hDubai < 11) return 'Same Day';
  if (hDubai < 14) return 'Check Cutoff';
  return 'Next Day';
}

const CUTOFF_STYLE: Record<CutoffLabel, { bg: string; text: string; border: string }> = {
  'Same Day':    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  'Check Cutoff':{ bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  'Next Day':    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'  },
};

export default function OrdersFiltered({ status }: { status: OrderStatus }) {
  const { orders } = useDelivery();
  const navigate = useNavigate();

  const filtered = status === 'New'
    ? orders.filter(o => o.status === 'New' || o.status === 'Assigned')
    : status === 'Delivered'
    ? orders.filter(o => o.status === 'Delivered' || o.status === 'Partially Delivered' || o.status === 'Rejected')
    : orders.filter(o => o.status === status);

  const cutoffGroups = useMemo(() => {
    if (status !== 'New') return null;
    const newOnly = filtered.filter(o => o.status === 'New');
    return {
      sameDay:     newOnly.filter(o => getCutoff(o) === 'Same Day'),
      checkCutoff: newOnly.filter(o => getCutoff(o) === 'Check Cutoff'),
      nextDay:     newOnly.filter(o => getCutoff(o) === 'Next Day'),
    };
  }, [filtered, status]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {status === 'New' ? 'New Orders' : `${status} Orders`}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {status === 'New' && filtered.filter(o => o.status === 'New').length > 0 && (
          <Button onClick={() => navigate('/dispatch')} size="sm" className="gap-2">
            <Route className="h-4 w-4" />
            Assign to Routes →
          </Button>
        )}
      </div>

      {/* Cutoff summary banner — New Orders only */}
      {cutoffGroups && (
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: 'Same Day' as CutoffLabel,    icon: '✅', orders: cutoffGroups.sameDay,    desc: 'Created before 11:00 AM' },
            { label: 'Check Cutoff' as CutoffLabel, icon: '⏳', orders: cutoffGroups.checkCutoff, desc: 'Created 11:00 AM – 2:00 PM' },
            { label: 'Next Day' as CutoffLabel,     icon: '📅', orders: cutoffGroups.nextDay,     desc: 'Created after 2:00 PM' },
          ] as const).map(({ label, icon, orders: g, desc }) => {
            const s = CUTOFF_STYLE[label];
            return (
              <div key={label} className={`rounded-lg border p-3 ${s.bg} ${s.border}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{icon}</span>
                  <span className={`text-xs font-bold ${s.text}`}>{label}</span>
                </div>
                <p className={`text-2xl font-bold ${s.text}`}>{g.length}</p>
                <p className={`text-[10px] ${s.text} opacity-70`}>{desc}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-order cutoff badge inline */}
      {status === 'New' && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(order => {
            const label = getCutoff(order);
            const s = CUTOFF_STYLE[label];
            return (
              <div
                key={order.id}
                className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{order.clientName}</span>
                    <span className="text-xs text-muted-foreground font-mono">{order.orderNumber}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{order.clientAddress}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} · AED {order.total.toFixed(0)} · {order.paymentMethod}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                    <Clock className="h-2.5 w-2.5" />
                    {label}
                  </span>
                  {order.status === 'Assigned' && (
                    <span className="text-[10px] text-blue-600 font-medium bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      Assigned
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Non-New statuses use the standard table */}
      {status !== 'New' && <OrdersTable orders={filtered} />}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-3 opacity-30" />
          <p className="text-sm">No {status.toLowerCase()} orders found</p>
        </div>
      )}
    </div>
  );
}
