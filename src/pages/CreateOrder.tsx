import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDelivery } from '@/contexts/DeliveryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Plus, Trash2, CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const TIME_SLOTS = [
  'Morning (8:00 AM – 12:00 PM)',
  'Afternoon (12:00 PM – 6:00 PM)',
];
import type { PaymentMethod, OrderItem, Package } from '@/data/sampleData';
import { nextPackageBarcode } from '@/data/sampleData';

/**
 * Auto-split items into packages based on total quantity.
 * Rule: qty ≤ 3 → 1 pkg  |  4–8 → 2 pkgs  |  9+ → 3 pkgs
 * Items are distributed round-robin across packages by line.
 */
function autoGeneratePackages(items: OrderItem[]): Package[] {
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const numPkgs  = totalQty <= 3 ? 1 : totalQty <= 8 ? 2 : 3;

  const buckets: OrderItem[][] = Array.from({ length: numPkgs }, () => []);
  items.forEach((item, idx) => buckets[idx % numPkgs].push(item));

  return buckets
    .filter(b => b.length > 0)
    .map((b, idx) => ({
      id:     `pkg-${Date.now()}-${idx + 1}`,
      barcode: nextPackageBarcode(),
      items:  b,
      status: 'pending' as const,
    }));
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const { addOrder, couriers, items: inventoryItems, customers } = useDelivery();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [floor, setFloor] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [courierId, setCourierId] = useState('');
  const [comment, setComment] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const addItem = () => {
    setOrderItems(prev => [...prev, { id: `ni-${Date.now()}`, name: '', quantity: 1, price: 0 }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    setOrderItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const total = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const [showAssignStep, setShowAssignStep] = useState(false);

  const handleProceedToAssign = () => {
    if (!clientName || orderItems.length === 0) return;
    setShowAssignStep(true);
  };

  const handleSubmit = () => {
    if (!courierId) return;
    const courier = couriers.find(c => c.id === courierId);

    const resolvedItems: OrderItem[] = orderItems.map(item => {
      const inv = inventoryItems.find(it => it.name === item.name);
      return { ...item, barcode: inv?.barcode || item.barcode };
    });

    // Auto-split into 1 / 2 / 3 packages depending on total quantity
    const packages = autoGeneratePackages(resolvedItems);

    addOrder({
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      clientName, clientPhone, clientAddress: address, floor,
      status: 'Assigned',
      courier: courier?.name, courierId,
      deliveryDate, deliveryTime, paymentMethod,
      items: resolvedItems,
      packages,
      total, comment,
    });
    navigate('/orders/all');
  };

  const selectCustomer = (custId: string) => {
    const cust = customers.find(c => c.id === custId);
    if (cust) { setClientName(cust.name); setClientPhone(cust.phone); setAddress(cust.address); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold text-foreground">Create Order</h2>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        {/* Client */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Client</Label>
            <Select onValueChange={selectCustomer}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select client..." /></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Phone</Label>
            <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Delivery Address</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Floor</Label>
            <Input value={floor} onChange={e => setFloor(e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal bg-secondary border-border', !deliveryDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? format(new Date(deliveryDate + 'T00:00:00'), 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate ? new Date(deliveryDate + 'T00:00:00') : undefined}
                  onSelect={date => setDeliveryDate(date ? format(date, 'yyyy-MM-dd') : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Delivery Time Window</Label>
            <Select value={deliveryTime} onValueChange={setDeliveryTime}>
              <SelectTrigger className="bg-secondary border-border">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Select time slot..." />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map(slot => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>


        <div className="space-y-2">
          <Label className="text-muted-foreground">Comment</Label>
          <Textarea value={comment} onChange={e => setComment(e.target.value)} className="bg-secondary border-border" rows={2} />
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-foreground">Items</h3>
          <Button variant="outline" size="sm" onClick={addItem} className="border-border">
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
        {orderItems.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">Product</TableHead>
                <TableHead className="text-muted-foreground w-24">Qty</TableHead>
                <TableHead className="text-muted-foreground w-32">Price</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Select value={item.name} onValueChange={v => {
                      const inv = inventoryItems.find(it => it.name === v);
                      if (inv) { updateItem(i, 'name', inv.name); updateItem(i, 'price', inv.price); }
                    }}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{inventoryItems.map(it => <SelectItem key={it.id} value={it.name}>{it.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="bg-secondary border-border" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" step="0.01" value={item.price} onChange={e => updateItem(i, 'price', parseFloat(e.target.value) || 0)} className="bg-secondary border-border" />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex justify-end mt-3 text-sm font-medium text-foreground">
          Total: ${total.toFixed(2)}
        </div>
      </div>

      {!showAssignStep ? (
        <div className="flex gap-3">
          <Button onClick={handleProceedToAssign} disabled={!clientName || orderItems.length === 0} className="bg-primary hover:bg-primary/90">
            Next: Assign Courier
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} className="border-border">Cancel</Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground text-lg">Assign to Courier</h3>
          <p className="text-sm text-muted-foreground">Select a courier to assign this order before creating it.</p>
          <Select value={courierId} onValueChange={setCourierId}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select courier..." />
            </SelectTrigger>
            <SelectContent>
              {couriers.filter(c => !c.isDeactivated).map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} — {c.currentOrders} active orders
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={!courierId} className="bg-primary hover:bg-primary/90">
              Create & Assign Order
            </Button>
            <Button variant="outline" onClick={() => setShowAssignStep(false)} className="border-border">Back</Button>
          </div>
        </div>
      )}
    </div>
  );
}
