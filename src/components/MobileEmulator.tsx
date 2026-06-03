import { useState, useRef, useCallback, useEffect } from 'react';
import { useDelivery } from '@/contexts/DeliveryContext';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, ScanLine, Check, MapPin, Phone, User, DollarSign,
  PenTool, X, Minus, Plus, Menu, AlertTriangle, Package, CheckCircle2, XCircle,
  Camera, RotateCcw, Map, Navigation, Eye, EyeOff, LogOut,
} from 'lucide-react';
import type { Order } from '@/data/sampleData';

type MobileScreen =
  | 'home' | 'pickup-list' | 'pickup-detail'
  | 'delivery' | 'delivery-detail'
  | 'my-route'
  | 'inventory' | 'inventory-detail' | 'settings';

export function MobileEmulator({ className }: { className?: string }) {
  const { orders, couriers, customers, items, confirmPickup, confirmDelivery, updateOrder, deliveryRuns } = useDelivery();

  // ── Auth state ──
  const [loggedInCourierId, setLoggedInCourierId] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const loggedInCourier = loggedInCourierId ? couriers.find(c => c.id === loggedInCourierId) ?? null : null;

  const handleLogin = () => {
    const u = loginUsername.trim().toLowerCase();
    const p = loginPassword.trim();
    const found = couriers.find(c =>
      (c.courierNumber.toLowerCase() === u || c.name.toLowerCase() === u) &&
      c.password === p
    );
    if (found) {
      setLoggedInCourierId(found.id);
      setLoginError('');
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError('Incorrect ID or password. Try again.');
    }
  };

  const handleLogout = () => {
    setLoggedInCourierId(null);
    setScreen('home');
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
  };

  const [screen, setScreen] = useState<MobileScreen>('home');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Delivery state
  const [deliveryScanInput, setDeliveryScanInput] = useState('');
  const [deliveredPkgIds, setDeliveredPkgIds] = useState<string[]>([]);
  const [deliveryScanError, setDeliveryScanError] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [adjustedQtys, setAdjustedQtys] = useState<Record<string, number>>({});
  const [showFullRejectModal, setShowFullRejectModal] = useState(false);
  const [fullRejectReason, setFullRejectReason] = useState('');
  // Client returns modal
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [returnSelectedItemId, setReturnSelectedItemId] = useState<string | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState('');
  const [returnsScanInput, setReturnsScanInput] = useState('');
  // Photo proof of delivery
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [cameraShutter, setCameraShutter] = useState(false);

  // Payment & signature
  const [cashAmount, setCashAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  // Auto-insert "P-" prefix for package barcode fields
  const withPkgPrefix = (val: string): string => {
    if (val === '') return '';
    const upper = val.toUpperCase();
    if (upper === 'P') return 'P-';
    if (upper.startsWith('P-')) return 'P-' + val.slice(2);
    return 'P-' + val;
  };

  const pickupOrders = orders.filter(o =>
    o.status === 'Assigned' && !o.pickedUp &&
    (!loggedInCourierId || o.courierId === loggedInCourierId)
  );
  const deliveryOrders = orders.filter(o =>
    o.status === 'In Transit' && o.pickedUp &&
    (!loggedInCourierId || o.courierId === loggedInCourierId)
  );
  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;
  const selectedItem = selectedItemId ? items.find(i => i.id === selectedItemId) : null;

  const now = new Date();

  // ── Pickup (package-level scanning) ──
  const [pkgScanInput, setPkgScanInput] = useState('');
  const [pickedPkgIds, setPickedPkgIds] = useState<string[]>([]);
  const [skippedPkgs, setSkippedPkgs] = useState<Record<string, string>>({}); // pkgId → reason
  const [scanError, setScanError] = useState(false);
  const [showPkgSkipModal, setShowPkgSkipModal] = useState<string | null>(null);
  const [pkgSkipReason, setPkgSkipReason] = useState('');

  const getOrderItemUnits = (order: Order) => order.items.reduce((sum, item) => sum + Math.max(item.quantity || 0, 0), 0);

  // Auto-clear pickup scan error after 2.5 s
  useEffect(() => {
    if (!scanError) return;
    const t = setTimeout(() => setScanError(false), 2500);
    return () => clearTimeout(t);
  }, [scanError]);

  // Auto-clear delivery scan error after 2.5 s
  useEffect(() => {
    if (!deliveryScanError) return;
    const t = setTimeout(() => setDeliveryScanError(false), 2500);
    return () => clearTimeout(t);
  }, [deliveryScanError]);

  const resetPickupState = () => {
    setPkgScanInput('');
    setPickedPkgIds([]);
    setSkippedPkgs({});
    setScanError(false);
    setShowPkgSkipModal(null);
    setPkgSkipReason('');
  };

  const handlePkgScan = () => {
    const val = pkgScanInput.trim();
    if (!val || !selectedOrder?.packages) { setPkgScanInput(''); return; }
    const found = selectedOrder.packages.find(
      p => p.barcode.toLowerCase() === val.toLowerCase()
    );
    if (found) {
      if (!pickedPkgIds.includes(found.id) && !skippedPkgs[found.id]) {
        setPickedPkgIds(prev => [...prev, found.id]);
      }
      setScanError(false);
    } else {
      setScanError(true);
    }
    setPkgScanInput('');
  };

  const handleSkipPackage = (pkgId: string) => {
    setShowPkgSkipModal(pkgId);
    setPkgSkipReason('');
  };

  const confirmSkipPackage = () => {
    if (!showPkgSkipModal || !pkgSkipReason.trim()) return;
    setSkippedPkgs(prev => ({ ...prev, [showPkgSkipModal]: pkgSkipReason }));
    setPickedPkgIds(prev => prev.filter(id => id !== showPkgSkipModal));
    setShowPkgSkipModal(null);
    setPkgSkipReason('');
  };

  const handleConfirmPickup = () => {
    if (!selectedOrder) return;
    confirmPickup(selectedOrder.id, pickedPkgIds, skippedPkgs);
    resetPickupState();
    setSelectedOrderId(null);
    setScreen('pickup-list');
  };

  // ── Delivery: dual-purpose scan (package barcode → deliver | item barcode → return) ──
  const handleDeliveryScan = () => {
    const val = deliveryScanInput.trim();
    if (!val || !selectedOrder) { setDeliveryScanInput(''); return; }
    const lower = val.toLowerCase();

    // 1. Package barcode → mark as delivered
    const foundPkg = selectedOrder.packages?.find(p => p.barcode.toLowerCase() === lower);
    if (foundPkg) {
      if (!deliveredPkgIds.includes(foundPkg.id)) {
        setDeliveredPkgIds(prev => [...prev, foundPkg.id]);
      }
      setDeliveryScanError(false);
      setDeliveryScanInput('');
      return;
    }

    // 2. Item/product barcode → open client returns modal with item pre-selected
    const foundItem = selectedOrder.items.find(i =>
      i.barcode?.toLowerCase() === lower || i.name.toLowerCase() === lower
    );
    if (foundItem) {
      openReturnsModal(foundItem.id);
      setDeliveryScanInput('');
      return;
    }

    // 3. No match → error
    setDeliveryScanError(true);
    setDeliveryScanInput('');
  };

  const getDeliveredQty = (itemId: string) => {
    if (adjustedQtys[itemId] !== undefined) return adjustedQtys[itemId];
    const item = selectedOrder?.items.find(i => i.id === itemId);
    return item?.pickedUpQty ?? item?.quantity ?? 0;
  };

  const openReturnsModal = (prefillItemId?: string) => {
    setReturnSelectedItemId(prefillItemId ?? null);
    setReturnQty(1);
    setReturnReason('');
    setReturnsScanInput('');
    setShowReturnsModal(true);
  };

  const handleReturnsScan = () => {
    if (!returnsScanInput.trim() || !selectedOrder) { setReturnsScanInput(''); return; }
    const found = selectedOrder.items.find(i =>
      i.barcode?.toLowerCase() === returnsScanInput.trim().toLowerCase() ||
      i.name.toLowerCase() === returnsScanInput.trim().toLowerCase()
    );
    if (found) {
      setReturnSelectedItemId(found.id);
      setReturnQty(1);
    }
    setReturnsScanInput('');
  };

  const handleAddReturn = () => {
    if (!returnSelectedItemId || !returnReason.trim()) return;
    const item = selectedOrder?.items.find(i => i.id === returnSelectedItemId);
    if (!item) return;
    const maxQty = item.pickedUpQty ?? item.quantity;
    const deliveredQty = Math.max(0, maxQty - returnQty);
    setAdjustedQtys(prev => ({ ...prev, [returnSelectedItemId]: deliveredQty }));
    setRejectionReasons(prev => ({ ...prev, [returnSelectedItemId]: returnReason }));
    setShowReturnsModal(false);
    setReturnSelectedItemId(null);
    setReturnQty(1);
    setReturnReason('');
  };

  const handleRemoveReturn = (itemId: string) => {
    setAdjustedQtys(prev => { const n = { ...prev }; delete n[itemId]; return n; });
    setRejectionReasons(prev => { const n = { ...prev }; delete n[itemId]; return n; });
  };

  const getDeliveryTotal = () => {
    if (!selectedOrder) return 0;
    return selectedOrder.items.reduce((sum, item) => {
      const qty = getDeliveredQty(item.id);
      return sum + qty * item.price;
    }, 0);
  };

  const handleStartDeliveryConfirm = () => {
    // Camera is always mandatory — pops up automatically on confirm
    setPhotoTaken(false);
    setShowCameraModal(true);
  };

  const handleCameraCapture = () => {
    setCameraShutter(true);
    setTimeout(() => {
      setCameraShutter(false);
      setPhotoTaken(true);
    }, 350);
  };

  const handlePhotoContinue = () => {
    setShowCameraModal(false);
    setShowPaymentModal(true);
    setCashAmount(getDeliveryTotal().toFixed(2));
  };

  const handleFullOrderReject = () => {
    if (!selectedOrder || !fullRejectReason) return;
    // Set all items to 0 delivered
    const updatedItems = selectedOrder.items.map(item => ({
      ...item,
      deliveredQty: 0,
      rejectionReason: fullRejectReason,
    }));
    updateOrder(selectedOrder.id, {
      items: updatedItems,
      deliveredTotal: 0,
      rejectionReason: fullRejectReason,
    });
    // Use 'Rejected' status for doorstep rejection
    confirmDelivery(selectedOrder.id, undefined, 'Rejected');
    // Reset
    setSelectedOrderId(null);
    setShowFullRejectModal(false);
    setFullRejectReason('');
    setAdjustedQtys({});
    setRejectionReasons({});
    setDeliveredPkgIds([]);
    setDeliveryScanError(false);
    setPhotoTaken(false);
    setShowReturnsModal(false);
    setScreen('delivery');
  };

  const handlePaymentConfirm = () => {
    setShowPaymentModal(false);
    setShowSignature(true);
  };

  const handleSignatureComplete = () => {
    if (!selectedOrder) return;
    // Build updated items with deliveredQty and rejectionReason
    const updatedItems = selectedOrder.items.map(item => ({
      ...item,
      deliveredQty: getDeliveredQty(item.id),
      rejectionReason: rejectionReasons[item.id] || undefined,
    }));
    const deliveredTotal = getDeliveryTotal();
    const cashRcv = parseFloat(cashAmount) || deliveredTotal;

    // Determine if this is a partial delivery
    const hasPickupShortage = selectedOrder.items.some(i => i.pickedUpQty !== undefined && i.pickedUpQty < i.quantity);
    const hasDeliveryRejection = updatedItems.some(i => {
      const effectiveQty = i.pickedUpQty ?? i.quantity;
      return (i.deliveredQty ?? effectiveQty) < effectiveQty;
    });
    const isPartial = hasPickupShortage || hasDeliveryRejection;
    const finalStatus = isPartial ? 'Partially Delivered' as any : 'Delivered' as any;

    updateOrder(selectedOrder.id, {
      items: updatedItems,
      deliveredTotal,
      cashReceived: selectedOrder.paymentMethod === 'Cash' ? cashRcv : undefined,
    });
    confirmDelivery(selectedOrder.id, signatureData || 'signed', finalStatus);

    // Reset
    setSelectedOrderId(null);
    setShowSignature(false);
    setSignatureData(null);
    setAdjustedQtys({});
    setRejectionReasons({});
    setDeliveredPkgIds([]);
    setDeliveryScanError(false);
    setPhotoTaken(false);
    setShowReturnsModal(false);
    setCashAmount('');
    setScreen('delivery');
  };

  // ── Signature canvas ──
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.lineTo(x, y);
    ctx.stroke();
  }, []);

  const stopDrawing = useCallback(() => {
    drawingRef.current = false;
    if (canvasRef.current) setSignatureData(canvasRef.current.toDataURL());
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureData(null);
  };

  // ─── Red header bar ───
  const RedHeader = ({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) => (
    <div className="bg-[hsl(0,72%,51%)] text-white px-3 py-2">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <p className="font-bold text-sm">{title}</p>
          {subtitle && <p className="text-[10px] opacity-90">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  // ─── HOME ───
  const renderHome = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-[hsl(0,72%,51%)] text-white px-3 py-3 flex items-center gap-3">
        <Menu className="h-5 w-5" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-sm">Cleverence DeliveryOps</span>
          {loggedInCourier && (
            <p className="text-[9px] opacity-80 truncate">{loggedInCourier.name} · {loggedInCourier.courierNumber}</p>
          )}
        </div>
      </div>
      <div className="p-3 space-y-2 flex-1">
        {[
          { num: 1, label: 'Pick Up', count: pickupOrders.length, screen: 'pickup-list' as MobileScreen },
          { num: 2, label: 'Delivery', count: deliveryOrders.length, screen: 'delivery' as MobileScreen, highlight: deliveryOrders.length > 0 },
          { num: 3, label: 'My Route', count: 0, screen: 'my-route' as MobileScreen },
          { num: 4, label: 'Browse Inventory', count: 0, screen: 'inventory' as MobileScreen },
          { num: 5, label: 'Settings', count: 0, screen: 'settings' as MobileScreen },
        ].map(item => (
          <button
            key={item.num}
            onClick={() => setScreen(item.screen)}
            className={cn(
              'w-full rounded-lg border-2 border-[hsl(0,72%,51%)] px-4 py-3 text-left flex items-center justify-between transition-colors',
              item.highlight ? 'bg-[hsl(0,72%,51%)] text-white' : 'bg-white text-[hsl(0,72%,51%)]'
            )}
          >
            <span className="font-bold text-sm">{item.num} {item.label}</span>
            {item.count > 0 && (
              <span className={cn('font-bold text-lg', item.highlight ? 'text-white' : 'text-[hsl(0,72%,51%)]')}>{item.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── PICKUP LIST ───
  const renderPickupList = () => (
    <div className="flex flex-col h-full bg-white">
      <RedHeader title="Pick Up" subtitle={`${pickupOrders.length} order(s) to pick up`} onBack={() => setScreen('home')} />
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {pickupOrders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No orders to pick up</p>
        ) : pickupOrders.map(order => (
          <button
            key={order.id}
            onClick={() => { resetPickupState(); setSelectedOrderId(order.id); setScreen('pickup-detail'); }}
            className="w-full text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
          >
            <p className="text-[hsl(0,72%,51%)] font-semibold text-sm">{order.orderNumber}</p>
            <p className="text-gray-700 text-xs mt-0.5">{order.clientName}</p>
            <p className="text-gray-400 text-[10px]">{order.clientAddress}</p>
            <div className="flex justify-between mt-1">
              <span className="text-gray-400 text-[10px]">
                {order.packages?.length ?? 1} pkg(s) · {getOrderItemUnits(order)} item(s)
              </span>
              <span className="text-gray-700 text-xs font-medium">${order.total.toFixed(2)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ─── PICKUP DETAIL ───
  const renderPickupDetail = () => {
    if (!selectedOrder) return null;
    const packages = selectedOrder.packages ?? [];
    const totalPkgs = packages.length;
    const pickedCount = pickedPkgIds.length;
    const skippedCount = Object.keys(skippedPkgs).length;
    const pendingCount = totalPkgs - pickedCount - skippedCount;
    const allDecided = pendingCount === 0 && totalPkgs > 0;
    const hasSkipped = skippedCount > 0;

    const SKIP_REASONS = ['Damaged', 'Spoiled', 'Expired', 'Not in Stock', 'Not Available'];

    return (
      <div className="flex flex-col h-full bg-white relative">
        <RedHeader
          title="Pick Up"
          subtitle={selectedOrder.orderNumber}
          onBack={() => { resetPickupState(); setSelectedOrderId(null); setScreen('pickup-list'); }}
        />

        {/* Progress strip */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 mb-1">
            <span>{pickedCount} of {totalPkgs} packages picked</span>
            {skippedCount > 0 && <span className="text-amber-600">{skippedCount} skipped</span>}
          </div>
          <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-gray-200">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                className={cn(
                  'flex-1 transition-colors',
                  pickedPkgIds.includes(pkg.id) ? 'bg-green-500' :
                  skippedPkgs[pkg.id]            ? 'bg-amber-400' :
                                                   'bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>

        {/* Scan field */}
        <div className="px-3 pt-2 pb-1.5 border-b border-gray-200">
          <p className="text-[10px] text-gray-500 mb-1 font-medium">SCAN PACKAGE BARCODE</p>
          <div className={cn(
            'flex items-center gap-2 border rounded px-2 py-1.5 transition-colors',
            scanError ? 'border-red-500 bg-red-50' : 'border-gray-300'
          )}>
            <ScanLine className={cn('h-4 w-4 shrink-0', scanError ? 'text-red-500' : 'text-[hsl(0,72%,51%)]')} />
            <input
              type="text"
              value={pkgScanInput}
              onChange={e => { setPkgScanInput(withPkgPrefix(e.target.value)); setScanError(false); }}
              onKeyDown={e => { if (e.key === 'Enter') handlePkgScan(); }}
              placeholder="P-… Enter package barcode"
              className="flex-1 text-xs bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Wrong-barcode error banner */}
          {scanError && (
            <div className="mt-1.5 flex items-center gap-1.5 bg-red-600 text-white rounded px-2 py-1.5">
              <XCircle className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide">Incorrect Barcode</p>
                <p className="text-[9px] opacity-90">This package does not belong to this order.</p>
              </div>
            </div>
          )}
        </div>

        {/* Package list */}
        <div className="flex-1 overflow-auto px-3 py-2 space-y-2">
          {packages.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">No packages configured for this order.</p>
          )}
          {packages.map(pkg => {
            const isPicked  = pickedPkgIds.includes(pkg.id);
            const isSkipped = !!skippedPkgs[pkg.id];
            const isPending = !isPicked && !isSkipped;
            return (
              <div
                key={pkg.id}
                className={cn(
                  'rounded-lg border px-3 py-2 transition-colors',
                  isPicked  ? 'border-green-400 bg-green-50'  :
                  isSkipped ? 'border-amber-400 bg-amber-50'  :
                              'border-gray-200 bg-white'
                )}
              >
                {/* Package header row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isPicked  && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                    {isSkipped && <XCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                    {isPending && <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                    <span className="font-bold text-xs font-mono text-gray-800">{pkg.barcode}</span>
                  </div>
                  <span className={cn(
                    'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                    isPicked  ? 'bg-green-200 text-green-800'  :
                    isSkipped ? 'bg-amber-200 text-amber-800'  :
                                'bg-gray-100 text-gray-500'
                  )}>
                    {isPicked ? 'Picked' : isSkipped ? 'Skipped' : 'Pending'}
                  </span>
                </div>

                {/* Packing list — always visible once picked; visible when pending too */}
                <div className="space-y-0.5 mb-1.5">
                  {pkg.items.map(item => (
                    <div key={item.id} className="flex justify-between text-[10px] text-gray-600">
                      <span className="truncate mr-2">{item.name}</span>
                      <span className="shrink-0 font-medium">×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Skip reason (if skipped) */}
                {isSkipped && (
                  <p className="text-[9px] text-amber-700 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Reason: {skippedPkgs[pkg.id]}
                  </p>
                )}

                {/* Skip button (if pending) */}
                {isPending && (
                  <button
                    onClick={() => handleSkipPackage(pkg.id)}
                    className="mt-1 text-[10px] text-amber-700 border border-amber-300 rounded px-2 py-0.5 hover:bg-amber-50 transition-colors"
                  >
                    Skip this package
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Confirm button */}
        <div className="p-3 border-t border-gray-100">
          {!allDecided && totalPkgs > 0 && (
            <p className="text-[9px] text-gray-400 text-center mb-1.5">
              Scan or skip all {pendingCount} remaining package(s) to confirm.
            </p>
          )}
          <button
            onClick={handleConfirmPickup}
            disabled={!allDecided || pickedCount === 0}
            className={cn(
              'w-full rounded-lg font-bold text-sm py-2.5 transition-opacity',
              allDecided && pickedCount > 0
                ? hasSkipped
                  ? 'bg-amber-500 text-white hover:opacity-90'
                  : 'bg-[hsl(142,71%,45%)] text-white hover:opacity-90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {hasSkipped
              ? <><AlertTriangle className="h-4 w-4 inline mr-1" />Confirm Partial Pickup</>
              : <><Check className="h-4 w-4 inline mr-1" />Confirm Pickup</>
            }
          </button>
        </div>

        {/* Skip reason modal */}
        {showPkgSkipModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="bg-white rounded-xl p-4 w-[88%] space-y-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800">Skip Package</h4>
                <button onClick={() => setShowPkgSkipModal(null)}><X className="h-4 w-4 text-gray-400" /></button>
              </div>
              <p className="text-[10px] text-gray-500 font-mono">
                {packages.find(p => p.id === showPkgSkipModal)?.barcode}
              </p>
              <p className="text-xs text-gray-600">Why is this package not being picked up?</p>
              <div className="space-y-1.5">
                {SKIP_REASONS.map(reason => (
                  <button
                    key={reason}
                    onClick={() => setPkgSkipReason(reason)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded border text-xs transition-colors',
                      pkgSkipReason === reason
                        ? 'border-amber-500 bg-amber-50 text-amber-800 font-medium'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {reason}
                  </button>
                ))}
                <input
                  type="text"
                  placeholder="Other reason..."
                  value={SKIP_REASONS.includes(pkgSkipReason) ? '' : pkgSkipReason}
                  onChange={e => setPkgSkipReason(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
              <button
                onClick={confirmSkipPackage}
                disabled={!pkgSkipReason.trim()}
                className="w-full rounded-lg bg-amber-500 text-white font-bold text-xs py-2 disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── DELIVERY LIST ───
  const renderDeliveryList = () => (
    <div className="flex flex-col h-full bg-white">
      <RedHeader title="Delivery" subtitle={`${deliveryOrders.length} order(s)`} onBack={() => setScreen('home')} />
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {deliveryOrders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No deliveries</p>
        ) : deliveryOrders.map(order => (
          <button
            key={order.id}
            onClick={() => {
              setSelectedOrderId(order.id);
              setAdjustedQtys({});
              setRejectionReasons({});
              setDeliveredPkgIds([]);
              setDeliveryScanError(false);
              setPhotoTaken(false);
              setScreen('delivery-detail');
            }}
            className="w-full text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
          >
            <p className="text-[hsl(0,72%,51%)] font-semibold text-sm">{order.orderNumber}</p>
            <p className="text-gray-700 text-xs mt-0.5">{order.clientName}</p>
            <p className="text-gray-400 text-[10px]">{order.clientAddress}</p>
            <div className="flex justify-between mt-1">
              <span className="text-gray-400 text-[10px]">{order.deliveryDate}</span>
              <span className="text-gray-700 text-xs font-medium">${order.total.toFixed(2)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ─── DELIVERY DETAIL ───
  const renderDeliveryDetail = () => {
    if (!selectedOrder) return null;
    const packages   = selectedOrder.packages ?? [];
    const totalPkgs  = packages.length;
    const deliveryTotal   = getDeliveryTotal();
    const hasReturns = selectedOrder.items.some(i =>
      rejectionReasons[i.id] || getDeliveredQty(i.id) < (i.pickedUpQty ?? i.quantity)
    );
    const RETURN_REASONS = ['Damaged/Defective', 'Expired', 'Wrong item', 'Customer refused', 'Quality issue'];

    return (
      <div className="flex flex-col h-full bg-white relative">
        <RedHeader
          title="Delivery"
          subtitle={selectedOrder.orderNumber}
          onBack={() => {
            setSelectedOrderId(null);
            setDeliveredPkgIds([]); setDeliveryScanError(false);
            setAdjustedQtys({}); setRejectionReasons({});
            setPhotoTaken(false);
            setScreen('delivery');
          }}
        />

        <div className="flex-1 overflow-auto p-3 space-y-2.5">
          {/* Client info */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <User className="h-3.5 w-3.5 text-gray-400" /><span className="font-medium">{selectedOrder.clientName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-gray-400" /><span>{selectedOrder.clientAddress}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="h-3.5 w-3.5 text-gray-400" /><span>{selectedOrder.clientPhone}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <DollarSign className="h-3.5 w-3.5 text-gray-400" />
              <span>{selectedOrder.paymentMethod} — ${selectedOrder.total.toFixed(2)}</span>
            </div>
            {selectedOrder.comment && (
              <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-xs text-gray-600 italic">
                <span className="font-medium text-gray-700 not-italic">Note: </span>{selectedOrder.comment}
              </div>
            )}
          </div>

          {/* ── Package delivery section ── */}
          <div className="border border-gray-200 rounded-lg p-3">
            {/* Progress */}
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 mb-1.5">
              <span>PACKAGE HANDOVER</span>
              <span className={cn(deliveredPkgIds.length === totalPkgs && totalPkgs > 0 ? 'text-green-600' : 'text-gray-400')}>
                {deliveredPkgIds.length}/{totalPkgs} scanned
              </span>
            </div>
            {totalPkgs > 1 && (
              <div className="flex gap-0.5 h-1 rounded-full overflow-hidden bg-gray-200 mb-2">
                {packages.map(pkg => (
                  <div key={pkg.id} className={cn('flex-1 transition-colors', deliveredPkgIds.includes(pkg.id) ? 'bg-green-500' : 'bg-gray-200')} />
                ))}
              </div>
            )}

            {/* Scan field */}
            <div className={cn('flex items-center gap-2 border rounded px-2 py-1.5 mb-1 transition-colors', deliveryScanError ? 'border-red-500 bg-red-50' : 'border-gray-300')}>
              <ScanLine className={cn('h-3.5 w-3.5 shrink-0', deliveryScanError ? 'text-red-500' : 'text-[hsl(0,72%,51%)]')} />
              <input
                type="text"
                value={deliveryScanInput}
                onChange={e => { setDeliveryScanInput(withPkgPrefix(e.target.value)); setDeliveryScanError(false); }}
                onKeyDown={e => e.key === 'Enter' && handleDeliveryScan()}
                placeholder="P-… Scan package or item barcode"
                className="flex-1 text-[11px] bg-transparent outline-none placeholder:text-gray-400"
              />
            </div>
            <p className="text-[9px] text-gray-400 mb-2">Scan package → deliver · Scan item → register return</p>

            {/* Error banner */}
            {deliveryScanError && (
              <div className="flex items-center gap-1.5 bg-red-600 text-white rounded px-2 py-1.5 mb-2">
                <XCircle className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide">Incorrect Barcode</p>
                  <p className="text-[9px] opacity-90">Barcode not recognised for this order.</p>
                </div>
              </div>
            )}

            {/* Package list */}
            <div className="space-y-1.5">
              {packages.map(pkg => {
                const isDelivered = deliveredPkgIds.includes(pkg.id);
                return (
                  <div key={pkg.id} className={cn('rounded border px-2.5 py-2 transition-colors', isDelivered ? 'border-green-400 bg-green-50' : 'border-gray-200')}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {isDelivered
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        : <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      }
                      <span className="font-mono text-xs font-bold text-gray-800">{pkg.barcode}</span>
                      <span className={cn('ml-auto text-[9px] font-semibold', isDelivered ? 'text-green-700' : 'text-gray-400')}>
                        {isDelivered ? 'Delivered ✓' : 'Pending'}
                      </span>
                    </div>
                    {pkg.items.map(item => (
                      <div key={item.id} className="flex justify-between text-[10px] text-gray-500 ml-5">
                        <span className="truncate mr-1">{item.name}</span>
                        <span>×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Client Returns section ── */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-[10px] text-gray-600 uppercase tracking-wide">Client Returns</p>
              {hasReturns && <span className="text-[9px] text-red-500 font-semibold">{Object.keys(rejectionReasons).length} item(s)</span>}
            </div>

            {/* Registered returns list */}
            {hasReturns ? (
              <div className="space-y-1 mb-2">
                {selectedOrder.items.filter(i => rejectionReasons[i.id]).map(item => {
                  const returnedQty = (item.pickedUpQty ?? item.quantity) - getDeliveredQty(item.id);
                  return (
                    <div key={item.id} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 truncate font-medium">{item.name}</p>
                        <p className="text-[9px] text-red-600">×{returnedQty} returned · {rejectionReasons[item.id]}</p>
                      </div>
                      <button onClick={() => handleRemoveReturn(item.id)} className="text-gray-400 hover:text-red-500 shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 mb-2">No returns registered.</p>
            )}

            <button
              onClick={() => openReturnsModal()}
              className="w-full border border-dashed border-gray-300 rounded text-[11px] text-gray-500 py-1.5 hover:border-[hsl(0,72%,51%)] hover:text-[hsl(0,72%,51%)] transition-colors"
            >
              + Register Client Return
            </button>

            {/* Total */}
            <div className="pt-2 mt-2 border-t border-gray-200">
              {hasReturns && (
                <div className="flex justify-between text-[10px] text-red-500 mb-0.5">
                  <span>Returns deducted</span>
                  <span>−${(selectedOrder.total - deliveryTotal).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-gray-800">
                <span>{hasReturns ? 'Payable Total' : 'Total'}</span>
                <span>${deliveryTotal.toFixed(2)}</span>
              </div>
              {selectedOrder.paymentMethod !== 'Cash' && hasReturns && (
                <p className="text-[9px] text-amber-600 mt-0.5">Prepaid — refund of ${(selectedOrder.total - deliveryTotal).toFixed(2)} to be issued</p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-3 space-y-2 border-t border-gray-100">
          <button
            onClick={handleStartDeliveryConfirm}
            className="w-full rounded-lg bg-[hsl(142,71%,45%)] text-white font-bold text-sm py-2.5 hover:opacity-90 transition-opacity"
          >
            <Check className="h-4 w-4 inline mr-1" /> Confirm Delivery
          </button>
          <button
            onClick={() => { setShowFullRejectModal(true); setFullRejectReason(''); }}
            className="w-full rounded-lg border border-[hsl(0,72%,51%)] text-[hsl(0,72%,51%)] font-bold text-xs py-2 hover:bg-red-50 transition-colors"
          >
            <X className="h-3.5 w-3.5 inline mr-1" /> Reject Entire Order
          </button>
        </div>

        {/* ── Camera modal (mandatory proof of delivery) ── */}
        {showCameraModal && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
            {cameraShutter && <div className="absolute inset-0 bg-white z-30 transition-opacity" />}
            {!photoTaken ? (
              <>
                <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-4 opacity-70">Proof of Delivery</p>
                {/* Viewfinder */}
                <div className="relative w-[200px] h-[140px] bg-gray-900 mb-4">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white" />
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="h-10 w-10 text-gray-600" />
                  </div>
                </div>
                <p className="text-gray-400 text-[10px] text-center mb-5 px-6">
                  Take a photo of the delivered package(s) at the client's door
                </p>
                <button
                  onClick={handleCameraCapture}
                  className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                  <div className="w-11 h-11 rounded-full border-2 border-gray-300 bg-white" />
                </button>
              </>
            ) : (
              <>
                <div className="relative w-[200px] h-[140px] bg-gray-800 flex items-center justify-center mb-3">
                  <Camera className="h-8 w-8 text-gray-500" />
                  <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute bottom-2 left-2 text-[8px] text-gray-400">{new Date().toLocaleTimeString()}</div>
                </div>
                <p className="text-green-400 text-sm font-bold mb-1">Photo captured ✓</p>
                <p className="text-gray-500 text-[10px] mb-6">Delivery documentation saved</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPhotoTaken(false)}
                    className="flex items-center gap-1 text-gray-400 text-xs px-3 py-2 rounded border border-gray-700 hover:border-gray-500"
                  >
                    <RotateCcw className="h-3 w-3" /> Retake
                  </button>
                  <button
                    onClick={handlePhotoContinue}
                    className="bg-green-500 text-white text-xs px-5 py-2 rounded font-bold hover:opacity-90"
                  >
                    Continue →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Client Returns modal — two-step flow */}
        {showReturnsModal && (() => {
          const REASONS = ['Damaged/Defective', 'Expired', 'Wrong item', 'Customer refused', 'Quality issue'];
          const selectedReturnItem = selectedOrder?.items.find(i => i.id === returnSelectedItemId);
          const maxQty = selectedReturnItem ? (selectedReturnItem.pickedUpQty ?? selectedReturnItem.quantity) : 1;

          return (
            <div className="absolute inset-0 bg-black/50 flex items-end z-20">
              <div className="bg-white rounded-t-2xl w-full p-4 shadow-2xl max-h-[82%] flex flex-col">

                {/* ── STEP 1: select item ── */}
                {!returnSelectedItemId && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-800">Select item to return</h4>
                      <button onClick={() => setShowReturnsModal(false)}><X className="h-4 w-4 text-gray-400" /></button>
                    </div>

                    {/* Scan field */}
                    <div className="flex items-center gap-2 border border-gray-300 rounded px-2 py-1.5 mb-3">
                      <ScanLine className="h-3.5 w-3.5 text-[hsl(0,72%,51%)] shrink-0" />
                      <input
                        type="text"
                        value={returnsScanInput}
                        onChange={e => setReturnsScanInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleReturnsScan()}
                        placeholder="Scan product barcode..."
                        className="flex-1 text-[11px] bg-transparent outline-none placeholder:text-gray-400"
                        autoFocus
                      />
                    </div>

                    {/* Scrollable item list */}
                    <div className="overflow-auto flex-1 space-y-1.5 pr-0.5">
                      {selectedOrder?.items.map(item => {
                        const alreadyReturned = !!rejectionReasons[item.id];
                        const maxQ = item.pickedUpQty ?? item.quantity;
                        return (
                          <button
                            key={item.id}
                            onClick={() => { setReturnSelectedItemId(item.id); setReturnQty(1); setReturnReason(''); }}
                            disabled={alreadyReturned}
                            className={cn(
                              'w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-colors',
                              alreadyReturned
                                ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 text-gray-700 hover:border-[hsl(0,72%,51%)] hover:bg-red-50'
                            )}
                          >
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                              <span>Barcode: <span className="font-mono">{item.barcode}</span></span>
                              <span>·</span>
                              <span>Qty: {maxQ}</span>
                              {alreadyReturned && <span className="text-red-400 ml-1">· Already registered</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* ── STEP 2: qty + reason for selected item ── */}
                {returnSelectedItemId && selectedReturnItem && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => { setReturnSelectedItemId(null); setReturnReason(''); setReturnsScanInput(''); }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 truncate">{selectedReturnItem.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono">{selectedReturnItem.barcode}</p>
                      </div>
                      <button onClick={() => setShowReturnsModal(false)}><X className="h-4 w-4 text-gray-400" /></button>
                    </div>

                    <div className="overflow-auto flex-1 space-y-4">
                      {/* Qty selector */}
                      <div>
                        <p className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-wide">Quantity to return</p>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setReturnQty(q => Math.max(1, q - 1))}
                            className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xl font-bold text-gray-800 w-8 text-center">{returnQty}</span>
                          <button
                            onClick={() => setReturnQty(q => Math.min(maxQty, q + 1))}
                            className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[10px] text-gray-400">of {maxQty} delivered</span>
                        </div>
                      </div>

                      {/* Reason */}
                      <div>
                        <p className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-wide">Reason for return</p>
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          {REASONS.map(r => (
                            <button
                              key={r}
                              onClick={() => setReturnReason(r)}
                              className={cn(
                                'text-[10px] px-2 py-2 rounded-lg border text-left transition-colors',
                                returnReason === r
                                  ? 'border-[hsl(0,72%,51%)] bg-red-50 text-[hsl(0,72%,51%)] font-semibold'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              )}
                            >{r}</button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Other reason..."
                          value={REASONS.includes(returnReason) ? '' : returnReason}
                          onChange={e => setReturnReason(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-[hsl(0,72%,51%)]"
                        />
                      </div>

                      <button
                        onClick={handleAddReturn}
                        disabled={!returnReason.trim()}
                        className="w-full rounded-lg bg-[hsl(0,72%,51%)] text-white font-bold text-xs py-3 disabled:opacity-40 hover:opacity-90 transition-opacity"
                      >
                        Add Return
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Payment modal */}
        {showPaymentModal && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-4 w-[85%] space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800">Payment</h4>
                <button onClick={() => setShowPaymentModal(false)}><X className="h-4 w-4 text-gray-400" /></button>
              </div>
              <p className="text-xs text-gray-500">Method: <span className="font-medium text-gray-700">{selectedOrder.paymentMethod}</span></p>
              <p className="text-xs text-gray-500">Amount due: <span className="text-gray-800 font-bold">${getDeliveryTotal().toFixed(2)}</span></p>
              {selectedOrder.paymentMethod === 'Cash' ? (
                <>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Cash received:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cashAmount}
                      onChange={e => setCashAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 outline-none focus:border-[hsl(0,72%,51%)]"
                    />
                  </div>
                  {cashAmount && parseFloat(cashAmount) >= getDeliveryTotal() && (
                    <p className="text-xs text-green-600">Change: ${(parseFloat(cashAmount) - getDeliveryTotal()).toFixed(2)}</p>
                  )}
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-xs text-green-700 font-medium">
                    {selectedOrder.paymentMethod === 'Card' ? '💳 Card payment' : '🌐 Prepaid online'}
                  </p>
                  <p className="text-[10px] text-green-600">Payment registered: ${getDeliveryTotal().toFixed(2)}</p>
                </div>
              )}
              <button
                onClick={handlePaymentConfirm}
                disabled={selectedOrder.paymentMethod === 'Cash' && (!cashAmount || parseFloat(cashAmount) < getDeliveryTotal())}
                className="w-full rounded-lg bg-[hsl(0,72%,51%)] text-white font-bold text-sm py-2.5 disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        )}

        {/* Signature modal */}
        {showSignature && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-4 w-[85%] space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800">Client Signature</h4>
                <button onClick={() => { setShowSignature(false); clearSignature(); }}><X className="h-4 w-4 text-gray-400" /></button>
              </div>
              <p className="text-xs text-gray-500">Please sign below to confirm receipt</p>
              <div className="border border-gray-300 rounded bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={220}
                  height={120}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={clearSignature} className="flex-1 rounded border border-gray-300 text-gray-600 text-xs py-2 font-medium">Clear</button>
                <button
                  onClick={handleSignatureComplete}
                  disabled={!signatureData}
                  className="flex-1 rounded bg-[hsl(0,72%,51%)] text-white text-xs py-2 font-bold disabled:opacity-40"
                >
                  <PenTool className="h-3 w-3 inline mr-1" /> Complete
                </button>
              </div>
              <button
                onClick={handleSignatureComplete}
                className="w-full text-center text-[10px] text-gray-400 hover:text-gray-600 py-1"
              >
                Skip signature (not home / left at door)
              </button>
            </div>
          </div>
        )}

        {/* Full order rejection modal */}
        {showFullRejectModal && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-4 w-[85%] space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800">Reject Entire Order</h4>
                <button onClick={() => setShowFullRejectModal(false)}><X className="h-4 w-4 text-gray-400" /></button>
              </div>
              <p className="text-xs text-gray-500">Why was the entire order not delivered?</p>
              {['Client not at home', 'Client refused order', 'No payment received', 'Wrong address', 'Access denied', 'Safety concern'].map(reason => (
                <button
                  key={reason}
                  onClick={() => setFullRejectReason(reason)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded border text-xs',
                    fullRejectReason === reason
                      ? 'border-[hsl(0,72%,51%)] bg-red-50 text-[hsl(0,72%,51%)] font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {reason}
                </button>
              ))}
              <input
                type="text"
                placeholder="Other reason..."
                value={!['Client not at home', 'Client refused order', 'No payment received', 'Wrong address', 'Access denied', 'Safety concern'].includes(fullRejectReason) ? fullRejectReason : ''}
                onChange={e => setFullRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 outline-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowFullRejectModal(false)} className="flex-1 rounded border border-gray-300 text-gray-600 text-xs py-2">
                  Cancel
                </button>
                <button onClick={handleFullOrderReject} disabled={!fullRejectReason} className="flex-1 rounded bg-[hsl(0,72%,51%)] text-white text-xs py-2 font-bold disabled:opacity-40">
                  Reject Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── MY ROUTE ───
  const renderMyRoute = () => {
    const activeRun = (loggedInCourierId
      ? deliveryRuns.find(r => r.driverId === loggedInCourierId && r.status !== 'Completed')
        ?? deliveryRuns.find(r => r.driverId === loggedInCourierId)
      : deliveryRuns.find(r => r.status === 'In Progress')
        ?? deliveryRuns.find(r => r.status === 'Planned')
        ?? deliveryRuns[0]
    ) ?? null;

    const getMapsLink = (address: string, clientName: string) => {
      const customer = customers.find(c => c.name === clientName);
      if (customer?.mapsLink) return customer.mapsLink;
      return `https://maps.google.com/?q=${encodeURIComponent(address + ', Dubai, UAE')}`;
    };

    const completedCount = activeRun?.stops.filter(s => s.status === 'completed').length ?? 0;
    const totalStops = activeRun?.stops.length ?? 0;

    return (
      <div className="flex flex-col h-full bg-white">
        <RedHeader title="My Route" subtitle={activeRun ? activeRun.runNumber : 'No active run'} onBack={() => setScreen('home')} />

        {!activeRun ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-gray-400 text-sm text-center">No dispatch run assigned yet</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {/* Driver + vehicle info */}
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-700 truncate">{activeRun.driverName}</p>
                <p className="text-[9px] text-gray-400 font-mono">{activeRun.vehiclePlate} · {activeRun.vehicleModel}</p>
              </div>
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                activeRun.status === 'In Progress'
                  ? 'bg-blue-100 text-blue-600'
                  : activeRun.status === 'Completed'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-500'
              )}>
                {activeRun.status}
              </span>
            </div>

            {/* Progress summary */}
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 mb-1">
                <span>{completedCount} of {totalStops} delivered</span>
                <span className="text-gray-400">Est. {activeRun.estimatedDuration}</span>
              </div>
              <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-gray-200">
                {activeRun.stops.map(stop => (
                  <div
                    key={stop.orderId}
                    className={cn('flex-1 transition-colors', stop.status === 'completed' ? 'bg-green-500' : 'bg-gray-200')}
                  />
                ))}
              </div>
            </div>

            {/* Stop list */}
            <div className="px-3 py-3 space-y-2">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Delivery Order</p>

              {activeRun.stops.map(stop => {
                const stopOrder = orders.find(o => o.id === stop.orderId);
                const done = stop.status === 'completed';
                const deliveredAt = stop.deliveredAt ?? stopOrder?.deliveredAt;
                const mapsUrl = getMapsLink(stop.clientAddress, stop.clientName);
                return (
                  <div
                    key={stop.orderId}
                    className={cn(
                      'py-2.5 px-2.5 rounded-lg border',
                      done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                        done ? 'bg-green-500' : 'bg-[hsl(0,72%,51%)]'
                      )}>
                        <span className="text-[9px] text-white font-bold">{stop.stopNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-[11px] font-semibold truncate',
                          done ? 'text-green-700' : 'text-gray-800'
                        )}>
                          {stop.clientName}
                        </p>
                        <p className="text-[9px] text-gray-400 truncate">{stop.clientAddress}</p>

                        {/* Google Maps link */}
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-[9px] text-blue-600 font-semibold hover:text-blue-800 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          <Navigation className="h-2.5 w-2.5" />
                          Open in Google Maps
                        </a>
                      </div>
                      {done && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                    </div>
                    {done && deliveredAt && (
                      <p className="text-[9px] text-green-600 font-semibold mt-1 pl-8">
                        ✓ Delivered at {new Date(deliveredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                    )}
                    {!done && (
                      <button
                        onClick={() => confirmDelivery(stop.orderId)}
                        className="mt-2 ml-8 w-[calc(100%-2rem)] flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold py-1.5 rounded-md transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        Confirm Delivery
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── INVENTORY LIST ───
  const renderInventoryList = () => (
    <div className="flex flex-col h-full bg-white">
      <RedHeader title="Browse Inventory" onBack={() => setScreen('home')} />
      <div className="flex-1 overflow-auto">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => { setSelectedItemId(item.id); setScreen('inventory-detail'); }}
            className="w-full text-left px-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <p className="text-[hsl(0,72%,51%)] font-semibold text-sm">{item.name}</p>
            <p className="text-gray-400 text-[10px]">{item.partNumber} • {item.barcode}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderInventoryDetail = () => {
    if (!selectedItem) return null;
    const fields = [
      { label: 'Marking', value: selectedItem.partNumber },
      { label: 'Barcode', value: selectedItem.barcode },
      { label: 'Price', value: `$${selectedItem.price.toFixed(2)}` },
      { label: 'UOM', value: selectedItem.uom },
    ];
    return (
      <div className="flex flex-col h-full bg-white">
        <RedHeader title="Browse Inventory" onBack={() => { setSelectedItemId(null); setScreen('inventory'); }} />
        <div className="p-4">
          <h3 className="text-[hsl(0,72%,51%)] font-bold text-lg mb-3">{selectedItem.name}</h3>
          <div className="space-y-2">
            {fields.map(f => (
              <div key={f.label} className="flex">
                <span className="text-gray-500 text-sm w-28 shrink-0">{f.label}</span>
                <span className="text-gray-800 text-sm font-medium">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── LOGIN ───
  const activeCouriers = couriers.filter(c => !c.isDeactivated);

  const renderLogin = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-[hsl(0,72%,51%)] text-white px-4 pt-6 pb-5 flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <User className="h-6 w-6 text-white" />
        </div>
        <p className="font-bold text-sm tracking-wide">Cleverence DeliveryOps</p>
        <p className="text-[10px] opacity-80">Driver Login</p>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {/* Driver picker */}
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Select Driver</p>
          <div className="grid gap-1.5">
            {activeCouriers.map(c => {
              const selected = loginUsername === c.courierNumber;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setLoginUsername(c.courierNumber);
                    setLoginPassword(c.password ?? '');
                    setLoginError('');
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left',
                    selected
                      ? 'border-[hsl(0,72%,51%)] bg-[hsl(0,72%,51%)]/5'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold',
                    selected ? 'bg-[hsl(0,72%,51%)] text-white' : 'bg-gray-100 text-gray-500'
                  )}>
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[11px] font-semibold truncate', selected ? 'text-[hsl(0,72%,51%)]' : 'text-gray-800')}>
                      {c.name}
                    </p>
                    <p className="text-[9px] text-gray-400 font-mono">{c.courierNumber} · {c.vehicleModel}</p>
                  </div>
                  {selected && (
                    <div className="w-4 h-4 rounded-full bg-[hsl(0,72%,51%)] flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Password — auto-filled, still editable */}
        {loginUsername && (
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Password</p>
            <div className="relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[hsl(0,72%,51%)] pr-9 bg-green-50 border-green-300"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showLoginPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[9px] text-green-600">✓ Password auto-filled</p>
          </div>
        )}

        {/* Error */}
        {loginError && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <p className="text-[10px] text-red-600">{loginError}</p>
          </div>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={!loginUsername.trim() || !loginPassword.trim()}
          className="w-full rounded-lg bg-[hsl(0,72%,51%)] text-white font-bold text-sm py-2.5 disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Log In as {loginUsername ? activeCouriers.find(c => c.courierNumber === loginUsername)?.name?.split(' ')[0] ?? 'Driver' : 'Driver'}
        </button>

        {/* Info note */}
        <div className="border border-dashed border-gray-200 rounded-lg p-3 mt-1">
          <p className="text-[9px] text-gray-400 text-center leading-relaxed">
            Each driver sees only their own assigned deliveries — select a driver above to see their personal view
          </p>
        </div>

      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col h-full bg-white">
      <RedHeader title="Settings" onBack={() => setScreen('home')} />

      {/* Logged-in driver card */}
      {loggedInCourier && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-[hsl(0,72%,51%)]/10 border border-[hsl(0,72%,51%)]/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[hsl(0,72%,51%)] flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">{loggedInCourier.name}</p>
            <p className="text-[10px] text-gray-500 font-mono">{loggedInCourier.courierNumber}</p>
          </div>
          <span className="text-[9px] font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
            {loggedInCourier.status}
          </span>
        </div>
      )}

      <div className="flex-1 p-3 space-y-2 mt-1">
        {['Courier Profile', 'Notifications', 'Sync Data', 'Language', 'About'].map(item => (
          <button key={item} className="w-full text-left px-3 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            {item}
          </button>
        ))}

        {/* Log out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 justify-center px-3 py-3 border border-[hsl(0,72%,51%)]/30 rounded-lg text-sm text-[hsl(0,72%,51%)] font-semibold hover:bg-red-50 transition-colors mt-2"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>

      <div className="text-center py-3">
        <p className="text-[10px] text-gray-400">Cleverence Delivery Ops</p>
        <p className="text-[10px] text-gray-400">v4.0.2</p>
      </div>
    </div>
  );

  const renderScreen = () => {
    if (!loggedInCourierId) return renderLogin();
    switch (screen) {
      case 'home': return renderHome();
      case 'pickup-list': return renderPickupList();
      case 'pickup-detail': return renderPickupDetail();
      case 'delivery': return renderDeliveryList();
      case 'delivery-detail': return renderDeliveryDetail();
      case 'my-route': return renderMyRoute();
      case 'inventory': return renderInventoryList();
      case 'inventory-detail': return renderInventoryDetail();
      case 'settings': return renderSettings();
      default: return renderHome();
    }
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative w-[280px] h-[520px] rounded-[1.2rem] border-[6px] border-[hsl(220,10%,20%)] bg-[hsl(220,10%,15%)] shadow-2xl overflow-hidden flex flex-col">
        <div className="h-6 bg-[hsl(220,10%,12%)] flex items-center justify-center shrink-0">
          <span className="text-[8px] text-gray-500 font-bold tracking-widest">DELIVERY DEVICE</span>
        </div>
        <div className="h-5 bg-[hsl(200,20%,20%)] flex items-center justify-between px-2 shrink-0">
          <span className="text-[8px] text-gray-300">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-[8px] text-gray-300">82%</span>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderScreen()}
        </div>
        <div className="h-5 bg-gray-100 flex items-center justify-between px-3 shrink-0 border-t border-gray-200">
          <span className="text-[7px] text-gray-400">Cleverence</span>
          <span className="text-[7px] text-gray-400">v4.0.2</span>
        </div>
        <div className="h-7 bg-[hsl(220,10%,12%)] flex items-center justify-center gap-6 shrink-0">
          <div className="w-0 h-0 border-l-[5px] border-l-gray-500 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent" />
          <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-500" />
          <div className="w-2.5 h-2.5 rounded-sm border-2 border-gray-500" />
        </div>
      </div>
    </div>
  );
}
