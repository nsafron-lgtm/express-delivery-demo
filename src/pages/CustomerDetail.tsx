import { useParams, useNavigate } from 'react-router-dom';
import { useDelivery } from '@/contexts/DeliveryContext';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import {
  ArrowLeft, Edit, Trash2, Users, Phone, Mail, MapPin, Calendar, ShoppingCart, DollarSign,
} from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, orders } = useDelivery();

  const customer = customers.find(c => c.id === id);
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>Customer not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/customers')}>Back to Clients</Button>
      </div>
    );
  }

  const customerOrders = orders.filter(o => o.clientName === customer.name)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalSpent = customerOrders.filter(o => o.status === 'Delivered').reduce((s, o) => s + o.total, 0);
  const avgOrder = customerOrders.length > 0 ? totalSpent / Math.max(customerOrders.filter(o => o.status === 'Delivered').length, 1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">{customer.name}</h2>
            <p className="text-sm text-muted-foreground">Client information and order history</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/customers')} className="border-border">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Edit className="h-4 w-4 mr-2" /> Edit Client
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Client Information</h3>
              <p className="text-sm text-muted-foreground">Contact details and account information</p>
            </div>
            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
          </div>

          <div className="grid md:grid-cols-2 gap-y-5 gap-x-8">
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><p className="text-xs text-muted-foreground">Full Name</p><p className="text-sm font-medium text-foreground">{customer.name}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><p className="text-xs text-muted-foreground">Client Since</p><p className="text-sm font-medium text-foreground">{customer.clientSince}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><p className="text-xs text-muted-foreground">Phone Number</p><p className="text-sm font-medium text-foreground">{customer.phone}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><p className="text-xs text-muted-foreground">Last Order</p><p className="text-sm font-medium text-foreground">{customer.lastOrder || '—'}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium text-foreground">{customer.email}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <ShoppingCart className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><p className="text-xs text-muted-foreground">Client ID</p><p className="text-sm font-medium text-foreground">{customer.clientId}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><p className="text-xs text-muted-foreground">City</p><p className="text-sm font-medium text-foreground">{customer.city}</p></div>
            </div>
          </div>
        </div>

        {/* Order Statistics */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Order Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Total Orders</span></div>
              <span className="text-sm font-bold text-primary">{customerOrders.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground ml-6">Total Spent</span>
              <span className="text-sm font-medium text-foreground">${totalSpent.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">Avg. Order Value</span></div>
              <span className="text-sm font-medium text-foreground">${avgOrder.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Address Information</h3>
        </div>
        <p className="text-sm text-muted-foreground">City: <span className="text-foreground">{customer.city}</span></p>
        <p className="text-sm text-muted-foreground mt-1">Address: <span className="text-foreground">{customer.address}</span></p>
        {customer.mapsLink && (
          <a
            href={customer.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary font-medium hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" />
            Open in Google Maps
          </a>
        )}
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Orders</h3>
          <Button variant="link" className="text-primary p-0" onClick={() => navigate('/orders/all')}>View all orders →</Button>
        </div>
        <div className="space-y-3">
          {customerOrders.slice(0, 5).map(order => (
            <div
              key={order.id}
              className="rounded-lg border border-border bg-background p-4 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">{order.orderNumber}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <p className="text-xs text-muted-foreground">{order.deliveryDate}</p>
                  <p className="text-xs text-muted-foreground">{order.clientAddress}</p>
                </div>
                <span className="text-sm font-medium text-foreground">${order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
          {customerOrders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>}
        </div>
      </div>
    </div>
  );
}
