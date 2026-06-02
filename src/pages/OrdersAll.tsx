import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDelivery } from '@/contexts/DeliveryContext';
import { StatusCard } from '@/components/StatusCard';
import { OrdersTable } from '@/components/OrdersTable';
import { isOverdue } from '@/components/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type LucideIcon } from 'lucide-react';
import {
  ShoppingCart, Plus, Send, CheckCircle, XCircle, ClipboardList, AlertTriangle, Clock, UserX,
} from 'lucide-react';
import type { OrderStatus } from '@/data/sampleData';

export default function OrdersAll() {
  const { orders, couriers } = useDelivery();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');

  const deactivatedCouriers = couriers.filter(c => c.isDeactivated);
  const overdueOrders = orders.filter(o => isOverdue(o));
  const unassignedOrders = orders.filter(o => o.status === 'New');

  const filtered = orders.filter(o => {
    if (statusFilter === 'Overdue') return isOverdue(o);
    if (statusFilter === 'Unassigned') return o.status === 'New';
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (courierFilter !== 'all' && o.courierId !== courierFilter) return false;
    return true;
  });

  const statusCounts: Record<string, number> = {
    All: orders.length,
    Unassigned: unassignedOrders.length,
    Overdue: overdueOrders.length,
    'In Transit': orders.filter(o => o.status === 'In Transit').length,
    Delivered: orders.filter(o => o.status === 'Delivered').length,
    Partial: orders.filter(o => o.status === 'Partially Delivered').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length,
  };

  const statusIcons: Record<string, LucideIcon> = {
    All: ShoppingCart, Unassigned: UserX, Overdue: Clock,
    'In Transit': Send, Delivered: CheckCircle, Partial: AlertTriangle, Cancelled: XCircle,
  };

  const statusVariants: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'destructive'> = {
    All: 'primary', Unassigned: 'warning', Overdue: 'destructive',
    'In Transit': 'warning', Delivered: 'success', Partial: 'warning', Cancelled: 'destructive',
  };

  const statusFilterMap: Record<string, string> = {
    All: 'all', Unassigned: 'Unassigned', Overdue: 'Overdue',
    'In Transit': 'In Transit', Delivered: 'Delivered', Partial: 'Partially Delivered', Cancelled: 'Cancelled',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">All Orders</h2>
        <Button onClick={() => navigate('/orders/create')} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Create Order
        </Button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <StatusCard
            key={status}
            title={status}
            value={count}
            icon={statusIcons[status]}
            variant={statusVariants[status]}
            onClick={() => setStatusFilter(statusFilterMap[status])}
            active={statusFilter === statusFilterMap[status]}
          />
        ))}
      </div>

      {overdueOrders.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <Clock className="h-4 w-4 shrink-0" />
          {overdueOrders.length} order(s) are overdue and haven't been assigned to a courier yet
        </div>
      )}

      {deactivatedCouriers.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {deactivatedCouriers.length} courier(s) are deactivated: {deactivatedCouriers.map(c => c.name).join(', ')}
        </div>
      )}

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Unassigned">Unassigned</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            {(['Assigned', 'In Transit', 'Delivered', 'Partially Delivered', 'Cancelled', 'Rejected'] as OrderStatus[]).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={courierFilter} onValueChange={setCourierFilter}>
          <SelectTrigger className="w-40 bg-card border-border"><SelectValue placeholder="Courier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Couriers</SelectItem>
            {couriers.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <OrdersTable orders={filtered} />
    </div>
  );
}
