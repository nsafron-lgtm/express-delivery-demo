import { useNavigate } from 'react-router-dom';
import { useDelivery } from '@/contexts/DeliveryContext';
import { StatusCard } from '@/components/StatusCard';
import {
  ShoppingCart, AlertCircle, Calendar, CheckCircle, XCircle,
  Download, UserPlus, Truck, Users, ClipboardList, Map, Activity, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

export default function Dashboard() {
  const { orders } = useDelivery();
  const navigate = useNavigate();

  const stats = {
    total: orders.length,
    unassigned: orders.filter(o => o.status === 'New').length,
    today: orders.filter(o => o.deliveryDate === new Date().toISOString().split('T')[0]).length,
    completed: orders.filter(o => o.status === 'Delivered').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
  };

  const recentOrders = orders.slice(0, 5);

  const quickActions = [
    { label: 'Fetch Order', icon: Download, action: () => navigate('/orders/create') },
    { label: 'Add Courier', icon: Truck, action: () => navigate('/couriers') },
    { label: 'Add Driver', icon: UserPlus, action: () => navigate('/couriers') },
    { label: 'Add Client', icon: Users, action: () => navigate('/customers') },
    { label: 'Assign Orders', icon: ClipboardList, action: () => navigate('/orders/assign') },
    { label: 'All Orders', icon: ShoppingCart, action: () => navigate('/orders/all') },
    { label: 'View Map', icon: Map, action: () => navigate('/map') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div /> {/* header title is in DashboardLayout */}
        <Button onClick={() => navigate('/orders/create')} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-sm h-9">
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatusCard title="Orders" value={stats.total} icon={ShoppingCart} variant="primary" />
        <StatusCard title="Unassigned" value={stats.unassigned} icon={AlertCircle} variant="warning" />
        <StatusCard title="To Deliver Today" value={stats.today} icon={Calendar} variant="primary" />
        <StatusCard title="Completed" value={stats.completed} icon={CheckCircle} variant="success" />
        <StatusCard title="Cancelled" value={stats.cancelled} icon={XCircle} variant="destructive" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Real-time Updates */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Real-time Updates</h3>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div
                key={order.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-accent/30 px-2 rounded"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{order.orderNumber}</span>
                  <span className="text-sm text-muted-foreground">{order.clientName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm text-muted-foreground">${order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(action => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="flex items-center gap-2 justify-start h-10 text-xs border-border hover:bg-accent hover:text-foreground"
              >
                <action.icon className="h-3.5 w-3.5 text-primary" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
