import { useState } from 'react';
import { useDelivery } from '@/contexts/DeliveryContext';
import { OrdersTable } from '@/components/OrdersTable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { UserCheck } from 'lucide-react';

export default function AssignOrders() {
  const { orders, couriers, assignCourier } = useDelivery();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [prioritizeExp, setPrioritizeExp] = useState(true);
  const [balanceWorkload, setBalanceWorkload] = useState(true);
  const [maxOrders, setMaxOrders] = useState('10');

  const unassigned = orders.filter(o => o.status === 'New');

  const handleAssign = () => {
    if (!selectedCourier || selectedIds.length === 0) return;
    selectedIds.forEach(id => assignCourier(id, selectedCourier));
    setSelectedIds([]);
    setSelectedCourier('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Assign Orders</h2>

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="font-medium text-foreground">Assignment Criteria</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Prioritize Experience</Label>
            <Switch checked={prioritizeExp} onCheckedChange={setPrioritizeExp} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Balance Workload</Label>
            <Switch checked={balanceWorkload} onCheckedChange={setBalanceWorkload} />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Max Orders per Courier</Label>
            <Input type="number" value={maxOrders} onChange={e => setMaxOrders(e.target.value)} className="w-20 bg-secondary border-border" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedCourier} onValueChange={setSelectedCourier}>
          <SelectTrigger className="w-52 bg-card border-border"><SelectValue placeholder="Select courier..." /></SelectTrigger>
          <SelectContent>
            {couriers.filter(c => !c.isDeactivated).map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name} ({c.currentOrders} active)</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAssign} disabled={!selectedCourier || selectedIds.length === 0} className="bg-primary hover:bg-primary/90">
          <UserCheck className="h-4 w-4 mr-2" /> Assign ({selectedIds.length})
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{unassigned.length} unassigned order(s)</p>
      <OrdersTable orders={unassigned} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
    </div>
  );
}
