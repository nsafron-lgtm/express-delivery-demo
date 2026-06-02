import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import type { Order } from '@/data/sampleData';

interface OrdersTableProps {
  orders: Order[];
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function OrdersTable({ orders, selectable, selectedIds = [], onSelectionChange }: OrdersTableProps) {
  const navigate = useNavigate();

  const toggleSelect = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter(s => s !== id)
        : [...selectedIds, id]
    );
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedIds.length === orders.length ? [] : orders.map(o => o.id));
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={orders.length > 0 && selectedIds.length === orders.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
            )}
            <TableHead className="text-muted-foreground">Order #</TableHead>
            <TableHead className="text-muted-foreground">Client</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Courier</TableHead>
            <TableHead className="text-muted-foreground">Delivery Date</TableHead>
            <TableHead className="text-muted-foreground">Payment</TableHead>
            <TableHead className="text-muted-foreground text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={selectable ? 8 : 7} className="text-center py-8 text-muted-foreground">
                No orders found
              </TableCell>
            </TableRow>
          ) : (
            orders.map(order => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                {selectable && (
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(order.id)}
                      onCheckedChange={() => toggleSelect(order.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium text-foreground">{order.orderNumber}</TableCell>
                <TableCell>{order.clientName}</TableCell>
                <TableCell><OrderStatusBadge status={order.status} order={order} /></TableCell>
                <TableCell>{order.courier || '\u2014'}</TableCell>
                <TableCell>{order.deliveryDate}</TableCell>
                <TableCell>{order.paymentMethod}</TableCell>
                <TableCell className="text-right font-medium">${order.total.toFixed(2)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
