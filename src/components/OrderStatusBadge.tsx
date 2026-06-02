import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/data/sampleData';

const statusStyles: Record<string, string> = {
  'New': 'bg-warning/15 text-warning border-warning/30',
  'Assigned': 'bg-info/15 text-info border-info/30',
  'In Transit': 'bg-warning/15 text-warning border-warning/30',
  'Delivered': 'bg-success/15 text-success border-success/30',
  'Partially Delivered': 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  'Cancelled': 'bg-destructive/15 text-destructive border-destructive/30',
  'Rejected': 'bg-destructive/15 text-destructive border-destructive/30',
  'Overdue': 'bg-destructive/15 text-destructive border-destructive/30',
  'Unassigned': 'bg-orange-500/15 text-orange-500 border-orange-500/30',
};

export function isOverdue(order: { status: string; deliveryDate: string }) {
  if (order.status !== 'New') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(order.deliveryDate + 'T00:00:00');
  return delivery < today;
}

export function getDisplayStatus(order: { status: OrderStatus; deliveryDate: string; courierId?: string }): string {
  if (order.status === 'New' && isOverdue(order)) return 'Overdue';
  if (order.status === 'New') return 'Unassigned';
  return order.status;
}

export function OrderStatusBadge({ status, order }: { status: OrderStatus; order?: { status: OrderStatus; deliveryDate: string; courierId?: string } }) {
  const displayStatus = order ? getDisplayStatus(order) : status;
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', statusStyles[displayStatus] || statusStyles[status])}>
      {displayStatus}
    </span>
  );
}
