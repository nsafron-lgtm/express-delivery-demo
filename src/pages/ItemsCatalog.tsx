import { useState } from 'react';
import { useDelivery } from '@/contexts/DeliveryContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Eye, QrCode, Edit, Trash2 } from 'lucide-react';

export default function ItemsCatalog() {
  const { items } = useDelivery();
  const [search, setSearch] = useState('');

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.partNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Items Catalog</h2>
          <p className="text-sm text-muted-foreground">{items.length} total items</p>
        </div>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="text-muted-foreground">Item Name</TableHead>
              <TableHead className="text-muted-foreground">Part Number</TableHead>
              <TableHead className="text-muted-foreground">Barcode</TableHead>
              <TableHead className="text-muted-foreground">UOM</TableHead>
              <TableHead className="text-muted-foreground text-right">Price</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(item => (
              <TableRow key={item.id} className="hover:bg-accent/50">
                <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                <TableCell className="text-muted-foreground">{item.partNumber}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{item.barcode}</TableCell>
                <TableCell className="text-muted-foreground">{item.uom}</TableCell>
                <TableCell className="text-right font-medium">${item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><QrCode className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
