import { useParams, useNavigate } from 'react-router-dom';
import { useDelivery } from '@/contexts/DeliveryContext';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, XCircle, Trash2, UserCheck, Phone, MapPin, CreditCard, Calendar, AlertTriangle, CheckCircle2, PackageCheck, PackageX, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, getOrderById, updateOrderStatus, deleteOrder } = useDelivery();
  const order = getOrderById(id || '');

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>Order not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/orders/all')}>Back to Orders</Button>
      </div>
    );
  }

  const isDelivered = order.status === 'Delivered' || order.status === 'Partially Delivered';
  const isCancelledWithReason = (order.status === 'Cancelled' || order.status === 'Rejected') && !!order.rejectionReason;
  const showDeliveryDetails = isDelivered || isCancelledWithReason;
  const isInTransit = order.status === 'In Transit';
  const hasPickupShortage = order.items.some(i => i.pickedUpQty !== undefined && i.pickedUpQty < i.quantity);
  const showPickupColumn = isInTransit && hasPickupShortage;
  const hasPickupRecord = !!order.pickedUpAt;
  const backorderOrder = order.backOrderId ? orders.find(o => o.id === order.backOrderId) : null;
  const originalOrder  = order.originalOrderId ? orders.find(o => o.id === order.originalOrderId) : null;

  const formatPickupTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{order.orderNumber}</h2>
          <p className="text-sm text-muted-foreground">{order.clientName}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="border-border">
            <UserCheck className="h-4 w-4 mr-1" /> Change Assignee
          </Button>
          <Button variant="outline" size="sm" className="border-border">
            <Edit className="h-4 w-4 mr-1" /> Edit Order
          </Button>
          <Button variant="outline" size="sm" className="border-warning/50 text-warning hover:bg-warning/10"
            onClick={() => updateOrderStatus(order.id, 'Cancelled')}>
            <XCircle className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => { deleteOrder(order.id); navigate('/orders/all'); }}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Backorder banner */}
      {order.isBackOrder && originalOrder && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm text-amber-800">
            <span className="font-semibold">Backorder</span> — items not collected during partial pickup of{' '}
            <button
              onClick={() => navigate(`/orders/${originalOrder.id}`)}
              className="underline font-medium hover:text-amber-900 inline-flex items-center gap-0.5"
            >
              {originalOrder.orderNumber} <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Original order → backorder link */}
      {backorderOrder && (
        <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <PackageX className="h-4 w-4 text-orange-500 shrink-0" />
          <div className="flex-1 text-sm text-orange-800">
            <span className="font-semibold">Partial pickup</span> — a backorder was automatically created:{' '}
            <button
              onClick={() => navigate(`/orders/${backorderOrder.id}`)}
              className="underline font-medium hover:text-orange-900 inline-flex items-center gap-0.5"
            >
              {backorderOrder.orderNumber} <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Order Info</h4>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Status</span><OrderStatusBadge status={order.status} /></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total</span><span className="text-sm font-semibold text-foreground">${order.total.toFixed(2)}</span></div>
            <div className="flex justify-between items-center gap-2"><span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Date</span><span className="text-sm text-foreground">{order.deliveryDate} {order.deliveryTime || ''}</span></div>
            <div className="flex justify-between items-center gap-2"><span className="text-sm text-muted-foreground flex items-center gap-1"><CreditCard className="h-3 w-3" />Payment</span><span className="text-sm text-foreground">{order.paymentMethod}</span></div>
            {order.orderBarcode && (
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Package Barcode</span><span className="text-sm text-foreground font-mono">{order.orderBarcode}</span></div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Client</h4>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{order.clientName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{order.clientPhone}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{order.clientAddress}</p>
            {order.floor && <p className="text-sm text-muted-foreground">Floor: {order.floor}</p>}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Assignee</h4>
          {order.courier ? (
            <p className="text-sm font-medium text-foreground">{order.courier}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Unassigned</p>
          )}
        </div>
      </div>

      {/* Items — always show ALL items, with delivery columns when delivered */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h4 className="font-medium text-foreground mb-3">Items</h4>

        {/* Full order rejection banner */}
        {isCancelledWithReason && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              <span className="font-medium">Entire order rejected: </span>
              {order.rejectionReason}
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Item</TableHead>
              <TableHead className="text-muted-foreground text-center">Ordered</TableHead>
              {showPickupColumn && (
                <TableHead className="text-muted-foreground text-center">Picked Up</TableHead>
              )}
              {showDeliveryDetails && <TableHead className="text-muted-foreground text-center">Delivered</TableHead>}
              <TableHead className="text-muted-foreground text-right">Price</TableHead>
              <TableHead className="text-muted-foreground text-right">{showDeliveryDetails ? 'Delivered Sum' : 'Sum'}</TableHead>
              {showDeliveryDetails && <TableHead className="text-muted-foreground">Status / Rejection</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.flatMap(item => {
              const hasPartialPickup = item.pickedUpQty !== undefined && item.pickedUpQty < item.quantity;
              const effectiveQty = item.pickedUpQty ?? item.quantity;
              const deliveredQty = item.deliveredQty ?? effectiveQty;
              const hasRejection = !!item.rejectionReason;
              const isPartialReject = showDeliveryDetails && hasRejection && deliveredQty > 0 && deliveredQty < effectiveQty;
              const rejectedQty = effectiveQty - deliveredQty;

              if (isPartialReject) {
                return [
                  <TableRow key={`${item.id}-delivered`} className="bg-green-50/30">
                    <TableCell className="text-foreground">
                      {item.name}
                      {item.barcode && <span className="text-xs text-muted-foreground ml-2 font-mono">{item.barcode}</span>}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    {showPickupColumn && (
                      <TableCell className={cn("text-center font-medium", hasPartialPickup && "text-warning")}>
                        {effectiveQty}
                      </TableCell>
                    )}
                    <TableCell className="text-center font-medium">{deliveredQty}</TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${(deliveredQty * item.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="text-green-500 text-xs">Delivered ✓</span>
                    </TableCell>
                  </TableRow>,
                  <TableRow key={`${item.id}-rejected`} className="bg-destructive/5">
                    <TableCell className="text-foreground">
                      {item.name}
                      {item.barcode && <span className="text-xs text-muted-foreground ml-2 font-mono">{item.barcode}</span>}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    {showPickupColumn && <TableCell className="text-center">—</TableCell>}
                    <TableCell className="text-center font-medium text-destructive">{rejectedQty}</TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">−${(rejectedQty * item.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-destructive text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        Rejected: {item.rejectionReason}
                      </div>
                    </TableCell>
                  </TableRow>
                ];
              }

              const notDelivered = showDeliveryDetails && deliveredQty === 0;
              return [(
                <TableRow key={item.id} className={cn(
                  hasRejection ? 'bg-destructive/5' : '',
                  notDelivered ? 'bg-destructive/10' : ''
                )}>
                  <TableCell className="text-foreground">
                    {item.name}
                    {item.barcode && <span className="text-xs text-muted-foreground ml-2 font-mono">{item.barcode}</span>}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  {showPickupColumn && (
                    <TableCell className={cn("text-center font-medium", hasPartialPickup && "text-warning")}>
                      {effectiveQty}
                    </TableCell>
                  )}
                  {showDeliveryDetails && (
                    <TableCell className={cn("text-center font-medium",
                      deliveredQty < effectiveQty && "text-warning",
                      deliveredQty === 0 && "text-destructive"
                    )}>{deliveredQty}</TableCell>
                  )}
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${(deliveredQty * item.price).toFixed(2)}</TableCell>
                  {showDeliveryDetails && (
                    <TableCell>
                      {hasRejection ? (
                        <div className="flex items-center gap-1 text-destructive text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Rejected: {item.rejectionReason}
                        </div>
                      ) : deliveredQty === 0 ? (
                        <span className="text-destructive text-xs">Not delivered</span>
                      ) : deliveredQty < effectiveQty ? (
                        <span className="text-warning text-xs">Partial delivery</span>
                      ) : (
                        <span className="text-green-500 text-xs">Delivered ✓</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )];
            })}
          </TableBody>
        </Table>
        {showDeliveryDetails && order.deliveredTotal !== undefined && (
          <div className="mt-3 flex justify-between text-sm border-t border-border pt-3">
            <span className="text-muted-foreground">Original Total: <span className="text-foreground">${order.total.toFixed(2)}</span></span>
            <span className={cn("font-medium", order.deliveredTotal < order.total ? "text-warning" : "text-foreground")}>
              Delivered Total: ${order.deliveredTotal.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Pickup Information — shown whenever a driver has confirmed pickup */}
      {hasPickupRecord && order.packages && order.packages.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-foreground">Pickup Record</h4>
            {order.pickupPartial ? (
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Partial Pickup</span>
            ) : (
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Full Pickup</span>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-3 text-sm mb-4">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Picked up by</p>
              <p className="font-medium text-foreground">{order.courier || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Pickup time</p>
              <p className="font-medium text-foreground">{formatPickupTime(order.pickedUpAt!)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Packages</p>
              <p className="font-medium text-foreground">
                {order.packages.filter(p => p.status === 'picked').length} picked
                {order.packages.some(p => p.status === 'skipped') && (
                  <span className="text-amber-600 ml-1">
                    · {order.packages.filter(p => p.status === 'skipped').length} skipped
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {order.packages.map(pkg => (
              <div
                key={pkg.id}
                className={cn(
                  'rounded-lg border p-3',
                  pkg.status === 'picked'  ? 'border-green-200 bg-green-50/40'  :
                  pkg.status === 'skipped' ? 'border-amber-200 bg-amber-50/40'  :
                                             'border-border bg-muted/20'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {pkg.status === 'picked'  && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                  {pkg.status === 'skipped' && <XCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                  <span className="font-mono text-sm font-semibold text-foreground">{pkg.barcode}</span>
                  <span className={cn(
                    'ml-auto text-xs font-medium',
                    pkg.status === 'picked'  ? 'text-green-700'  :
                    pkg.status === 'skipped' ? 'text-amber-700'  :
                                               'text-muted-foreground'
                  )}>
                    {pkg.status === 'picked' ? 'Picked up' : pkg.status === 'skipped' ? 'Skipped' : 'Pending'}
                    {pkg.pickedAt && ` · ${new Date(pkg.pickedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>

                {pkg.skipReason && (
                  <div className="flex items-center gap-1 text-xs text-amber-700 mb-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    Reason: {pkg.skipReason}
                  </div>
                )}

                <div className="space-y-0.5">
                  {pkg.items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.name}</span>
                      <span className="font-medium">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pickup Shortage Details — shown as separate section for finished orders */}
      {hasPickupShortage && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <h4 className="text-sm font-medium text-warning mb-2 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Pickup Shortage
          </h4>
          <div className="space-y-1">
            {order.items.filter(i => i.pickedUpQty !== undefined && i.pickedUpQty < i.quantity).map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Picked up {item.pickedUpQty} of {item.quantity}
                  </span>
                  {item.pickupRejectionReason && (
                    <span className="text-warning text-xs">Reason: {item.pickupRejectionReason}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.comment && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Comment</h4>
          <p className="text-sm text-foreground">{order.comment}</p>
        </div>
      )}

      {/* Signature & Payment info for delivered orders */}
      {isDelivered && (
        <div className="grid md:grid-cols-2 gap-4">
          {order.signature && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Client Signature</h4>
              {order.signature.startsWith('data:image') ? (
                <img src={order.signature} alt="Client signature" className="border border-border rounded bg-white max-h-40 w-full object-contain" />
              ) : (
                <p className="text-sm text-muted-foreground italic">Signature recorded</p>
              )}
            </div>
          )}
          {order.cashReceived !== undefined && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Cash Payment</h4>
              <p className="text-sm text-foreground">Received: <span className="font-medium">${order.cashReceived.toFixed(2)}</span></p>
              {order.deliveredTotal !== undefined && (
                <p className="text-sm text-muted-foreground">Change: ${(order.cashReceived - order.deliveredTotal).toFixed(2)}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
