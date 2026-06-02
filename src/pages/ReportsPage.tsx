import { useDelivery } from '@/contexts/DeliveryContext';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw, ShoppingCart, CheckCircle, DollarSign, TrendingUp, Truck, Users, AlertTriangle, Clock, XCircle, ArrowRight, Send } from 'lucide-react';

export default function ReportsPage() {
  const { orders, couriers } = useDelivery();
  const delivered = orders.filter(o => o.status === 'Delivered');
  const totalRevenue = delivered.reduce((s, o) => s + o.total, 0);
  const completionRate = orders.length > 0 ? ((delivered.length / orders.length) * 100).toFixed(1) : '0';
  const avgValue = delivered.length > 0 ? totalRevenue / delivered.length : 0;
  const activeCouriers = couriers.filter(c => !c.isDeactivated).length;
  const inTransit = orders.filter(o => o.status === 'In Transit').length;
  const pending = orders.filter(o => o.status === 'New' || o.status === 'Assigned').length;
  const cancelled = orders.filter(o => o.status === 'Cancelled').length;

  const reports = [
    { title: 'Courier Performance', desc: 'Analyze courier delivery performance, success rates, and efficiency metrics', icon: Truck },
    { title: 'Financial Report', desc: 'Revenue analysis, payment methods, and financial performance tracking', icon: DollarSign },
    { title: 'Client Analytics', desc: 'Customer behavior, order patterns, and client performance insights', icon: Users },
    { title: 'Operational Reports', desc: 'Order processing, delivery patterns, and operational insights', icon: TrendingUp },
    { title: 'Cancel Orders Report', desc: 'View and analyze cancelled orders, cancellation reasons, and cancellation trends', icon: XCircle },
    { title: 'Delivered Orders Report', desc: 'View and analyze successfully delivered orders, delivery performance, and trends', icon: CheckCircle },
    { title: 'Orders In Transit Report', desc: 'View and analyze orders currently in transit, track active deliveries, and monitor progress', icon: Send },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Reports & Analytics</h2>
            <p className="text-sm text-muted-foreground">Comprehensive delivery performance and business intelligence</p>
          </div>
        </div>
        <Button variant="outline" className="border-border"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, sub: 'Last 365 days', icon: ShoppingCart, color: 'text-primary' },
          { label: 'Completion Rate', value: `${completionRate}%`, sub: 'Successfully delivered', icon: CheckCircle, color: 'text-primary' },
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(0)}`, sub: 'Delivered orders only', icon: DollarSign, color: 'text-primary' },
          { label: 'Avg Order Value', value: `$${avgValue.toFixed(2)}`, sub: 'Per completed order', icon: TrendingUp, color: 'text-primary' },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
              <div><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.sub}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Couriers (Total)', value: couriers.length, sub: 'All couriers in system', icon: Users },
          { label: 'Couriers (Active)', value: activeCouriers, sub: 'Currently available', icon: Truck },
          { label: 'Successful Deliveries', value: delivered.length, sub: 'Delivered', icon: CheckCircle },
          { label: 'Missed-Time Deliveries', value: 0, sub: 'Delivered after scheduled time', icon: AlertTriangle },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><stat.icon className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.sub}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Clock, value: pending, label: 'Pending' },
          { icon: Send, value: inTransit, label: 'In Transit' },
          { icon: XCircle, value: cancelled, label: 'Cancelled' },
          { icon: AlertTriangle, value: 0, label: 'Missed-Time' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4 flex items-center justify-center gap-2">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
      <h3 className="text-lg font-semibold text-foreground">Available Reports</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {reports.map(report => (
          <div key={report.title} className="rounded-lg border border-border bg-card p-5 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><report.icon className="h-6 w-6 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground">{report.title}</h4>
              <p className="text-sm text-muted-foreground">{report.desc}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
