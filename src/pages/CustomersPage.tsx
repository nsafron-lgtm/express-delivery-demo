import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDelivery } from '@/contexts/DeliveryContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Eye, Edit, Users, RefreshCw, Plus, X } from 'lucide-react';
import type { Customer } from '@/data/sampleData';

export default function CustomersPage() {
  const { customers, orders, addCustomer, updateCustomer } = useDelivery();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.clientId.toLowerCase().includes(search.toLowerCase())
  );

  const getLastOrder = (name: string) => {
    const customerOrders = orders.filter(o => o.clientName === name).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return customerOrders[0];
  };

  const openAddForm = () => {
    setEditingCustomer(null);
    setFormName(''); setFormPhone(''); setFormEmail(''); setFormAddress(''); setFormCity('');
    setShowForm(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name); setFormPhone(customer.phone); setFormEmail(customer.email);
    setFormAddress(customer.address); setFormCity(customer.city);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) return;
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName, phone: formPhone, email: formEmail, address: formAddress, city: formCity,
      });
    } else {
      addCustomer({
        name: formName, phone: formPhone, email: formEmail, address: formAddress, city: formCity,
        ordersCount: 0, totalSpent: 0, clientSince: new Date().toISOString().slice(0, 10),
      });
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Clients</h2>
            <p className="text-sm text-muted-foreground">Manage customers and their orders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={openAddForm}><Plus className="h-4 w-4 mr-2" /> Add Client</Button>
        </div>
      </div>

      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, phone or ID" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="text-muted-foreground uppercase text-xs">Full Name</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Phone</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Email</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Orders</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Total Spent</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs">Last Order</TableHead>
              <TableHead className="text-muted-foreground uppercase text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(customer => {
              const lastOrd = getLastOrder(customer.name);
              return (
                <TableRow key={customer.id} className="hover:bg-accent/50 cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                  <TableCell className="text-foreground">{customer.ordersCount}</TableCell>
                  <TableCell className="text-foreground font-medium">${customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>
                    {lastOrd ? (
                      <div>
                        <span className="text-foreground text-sm">{lastOrd.orderNumber}</span>
                        <p className="text-xs text-muted-foreground">{lastOrd.deliveryDate}</p>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/customers/${customer.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(customer)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">Showing {filtered.length} of {customers.length} results</p>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Full Name *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} className="bg-secondary border-border" />
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
            <div className="space-y-2">
              <Label className="text-muted-foreground">Address</Label>
              <Input value={formAddress} onChange={e => setFormAddress(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">City</Label>
              <Input value={formCity} onChange={e => setFormCity(e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formName.trim()}>{editingCustomer ? 'Save Changes' : 'Add Client'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
