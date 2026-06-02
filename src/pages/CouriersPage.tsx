import { useState } from 'react';
import { useDelivery } from '@/contexts/DeliveryContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Edit, Trash2, Truck, RefreshCw, Plus, Phone, Mail, Star, Eye, EyeOff } from 'lucide-react';
import type { Courier } from '@/data/sampleData';

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} className={`h-3 w-3 ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function CouriersPage() {
  const { couriers, orders, addCourier, updateCourier, deleteCourier } = useDelivery();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCourierNumber, setFormCourierNumber] = useState('');
  const [formVehiclePlate, setFormVehiclePlate] = useState('');
  const [formVehicleModel, setFormVehicleModel] = useState('');

  const filtered = couriers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.courierNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getWorkload = (courierId: string) => {
    return orders.filter(o => o.courierId === courierId && !['Delivered', 'Cancelled'].includes(o.status)).length;
  };

  const openAddForm = () => {
    setEditingCourier(null);
    setFormName(''); setFormPhone(''); setFormEmail(''); setFormPassword('');
    setFormCourierNumber(`COUR-${String(couriers.length + 1).padStart(3, '0')}`);
    setFormVehiclePlate(''); setFormVehicleModel('');
    setShowPassword(false);
    setShowForm(true);
  };

  const openEditForm = (courier: Courier) => {
    setEditingCourier(courier);
    setFormName(courier.name); setFormPhone(courier.phone); setFormEmail(courier.email || '');
    setFormPassword(courier.password || ''); setFormCourierNumber(courier.courierNumber);
    setFormVehiclePlate(courier.vehiclePlate || ''); setFormVehicleModel(courier.vehicleModel || '');
    setShowPassword(false);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formCourierNumber.trim()) return;
    if (editingCourier) {
      updateCourier(editingCourier.id, {
        name: formName, phone: formPhone, email: formEmail || undefined,
        password: formPassword || undefined, courierNumber: formCourierNumber,
        vehiclePlate: formVehiclePlate || undefined, vehicleModel: formVehicleModel || undefined,
      });
    } else {
      addCourier({
        courierNumber: formCourierNumber, name: formName, phone: formPhone,
        email: formEmail || undefined, password: formPassword || undefined,
        status: 'Active', ordersCompleted: 0, currentOrders: 0, rating: 0, successRate: 0,
        vehiclePlate: formVehiclePlate || undefined, vehicleModel: formVehicleModel || undefined,
      });
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Couriers</h2>
            <p className="text-sm text-muted-foreground">Manage delivery couriers</p>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={openAddForm}>
          <Plus className="h-4 w-4 mr-2" /> Add Courier
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Button variant="outline" className="border-border"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="text-muted-foreground uppercase text-xs">Courier</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Vehicle</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Contact</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Status</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Rating</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Workload</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Deliveries</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(courier => {
              const workload = getWorkload(courier.id);
              return (
                <TableRow key={courier.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{courier.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{courier.courierNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {courier.vehiclePlate ? (
                      <div>
                        <p className="text-sm font-mono text-foreground">{courier.vehiclePlate}</p>
                        <p className="text-xs text-muted-foreground">{courier.vehicleModel}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{courier.phone}</p>
                      {courier.email && <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{courier.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      courier.status === 'Active' ? 'bg-green-500/10 text-green-500' :
                      courier.status === 'On Delivery' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-muted text-muted-foreground'
                    }`}>{courier.status}</span>
                  </TableCell>
                  <TableCell>
                    <RatingStars rating={courier.rating} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{courier.successRate}% success</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">{workload} active</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground font-medium">{courier.ordersCompleted}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(courier)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCourier(courier.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourier ? 'Edit Courier' : 'Add New Courier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Full Name *</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Courier Number *</Label>
                <Input value={formCourierNumber} onChange={e => setFormCourierNumber(e.target.value)} placeholder="COUR-001" className="bg-secondary border-border font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Phone</Label>
                <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input value={formEmail} onChange={e => setFormEmail(e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Vehicle Plate</Label>
                <Input value={formVehiclePlate} onChange={e => setFormVehiclePlate(e.target.value)} placeholder="DXB-A-12345" className="bg-secondary border-border font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Vehicle Model</Label>
                <Input value={formVehicleModel} onChange={e => setFormVehicleModel(e.target.value)} placeholder="Toyota Hiace" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Mobile App Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder="Password for courier mobile login"
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {editingCourier && (
              <div className="border border-border rounded-lg p-3 bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Delivery Rating</p>
                <RatingStars rating={editingCourier.rating} />
                <p className="text-xs text-muted-foreground mt-1">{editingCourier.ordersCompleted} deliveries • {editingCourier.successRate}% success rate</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formName.trim() || !formCourierNumber.trim()}>
              {editingCourier ? 'Save Changes' : 'Add Courier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
