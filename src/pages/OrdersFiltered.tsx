import { useDelivery } from '@/contexts/DeliveryContext';
import { OrdersTable } from '@/components/OrdersTable';
import { isOverdue } from '@/components/OrderStatusBadge';
import type { OrderStatus } from '@/data/sampleData';

export default function OrdersFiltered({ status }: { status: OrderStatus }) {
  const { orders } = useDelivery();

  // "New Orders" tab shows both New (unassigned) and Assigned (not yet picked up)
  // "Delivered" tab shows Delivered, Partially Delivered, and Rejected
  const filtered = status === 'New'
    ? orders.filter(o => o.status === 'New' || o.status === 'Assigned')
    : status === 'Delivered'
    ? orders.filter(o => o.status === 'Delivered' || o.status === 'Partially Delivered' || o.status === 'Rejected')
    : orders.filter(o => o.status === status);
  const overdueCount = status === 'New' ? filtered.filter(o => isOverdue(o)).length : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">
        {status === 'New' ? 'New Orders' : `${status} Orders`}
      </h2>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{filtered.length} order(s)</span>
        {overdueCount > 0 && (
          <span className="text-destructive font-medium">{overdueCount} overdue</span>
        )}
      </div>
      <OrdersTable orders={filtered} />
    </div>
  );
}
