import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Order, Courier, InventoryItem, Customer, OrderStatus, Package, DeliveryRun, RouteStop,
  sampleOrders, sampleCouriers, sampleItems, sampleCustomers, sampleDeliveryRuns,
  nextPackageBarcode,
} from '@/data/sampleData';

interface DeliveryContextType {
  orders: Order[];
  couriers: Courier[];
  items: InventoryItem[];
  customers: Customer[];
  deliveryRuns: DeliveryRun[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  assignCourier: (orderId: string, courierId: string) => void;
  deleteOrder: (orderId: string) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrderById: (id: string) => Order | undefined;
  confirmPickup: (orderId: string, pickedPkgIds: string[], skipReasons: Record<string, string>) => void;
  confirmDelivery: (orderId: string, signature?: string, statusOverride?: OrderStatus) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'clientId'>) => void;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
  addCourier: (courier: Omit<Courier, 'id'>) => void;
  updateCourier: (courierId: string, updates: Partial<Courier>) => void;
  deleteCourier: (courierId: string) => void;
  createDeliveryRun: (run: Omit<DeliveryRun, 'id' | 'createdAt'>) => DeliveryRun;
  updateDeliveryRun: (runId: string, updates: Partial<DeliveryRun>) => void;
  deleteDeliveryRun: (runId: string) => void;
}

const DeliveryContext = createContext<DeliveryContextType | null>(null);

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [couriers, setCouriers] = useState<Courier[]>(sampleCouriers);
  const [items] = useState<InventoryItem[]>(sampleItems);
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers);
  const [deliveryRuns, setDeliveryRuns] = useState<DeliveryRun[]>(sampleDeliveryRuns);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      id: `o${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  const updateOrder = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
  }, []);

  const assignCourier = useCallback((orderId: string, courierId: string) => {
    const courier = couriers.find(c => c.id === courierId);
    if (!courier) return;
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, courier: courier.name, courierId, status: 'Assigned' as OrderStatus } : o
    ));
  }, [couriers]);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const getOrdersByStatus = useCallback((status: OrderStatus) => {
    return orders.filter(o => o.status === status);
  }, [orders]);

  const getOrderById = useCallback((id: string) => {
    return orders.find(o => o.id === id);
  }, [orders]);

  const confirmPickup = useCallback((
    orderId: string,
    pickedPkgIds: string[],
    skipReasons: Record<string, string>,
  ) => {
    const now = new Date().toISOString();

    setOrders(prev => {
      const order = prev.find(o => o.id === orderId);
      if (!order) return prev;

      const packages = order.packages ?? [];

      // Stamp each package with its new status
      const updatedPackages: Package[] = packages.map(pkg => {
        if (pickedPkgIds.includes(pkg.id)) {
          return { ...pkg, status: 'picked' as const, pickedAt: now };
        }
        if (skipReasons[pkg.id]) {
          return { ...pkg, status: 'skipped' as const, skipReason: skipReasons[pkg.id] };
        }
        return pkg;
      });

      const isPartial = updatedPackages.some(p => p.status === 'skipped');

      // Reflect pickup in item-level pickedUpQty so the delivery flow still works
      const skippedItemIds = new Set(
        updatedPackages
          .filter(p => p.status === 'skipped')
          .flatMap(p => p.items.map(i => i.id))
      );
      const updatedItems = order.items.map(item => ({
        ...item,
        pickedUpQty: skippedItemIds.has(item.id) ? 0 : item.quantity,
      }));

      const backorderId = isPartial ? `o${Date.now()}bo` : undefined;

      const updatedOrder: Order = {
        ...order,
        pickedUp: true,
        status: 'In Transit' as OrderStatus,
        pickedUpAt: now,
        pickupPartial: isPartial,
        packages: updatedPackages,
        items: updatedItems,
        backOrderId: backorderId,
      };

      if (!isPartial || !backorderId) {
        return prev.map(o => o.id === orderId ? updatedOrder : o);
      }

      // Build backorder from skipped packages
      const skippedPkgs = updatedPackages.filter(p => p.status === 'skipped');

      // Deduplicate items across skipped packages by item name+barcode
      const boItemMap = new Map<string, { item: typeof order.items[0]; qty: number }>();
      skippedPkgs.forEach(pkg => {
        pkg.items.forEach(item => {
          const key = item.barcode || item.name;
          if (boItemMap.has(key)) {
            boItemMap.get(key)!.qty += item.quantity;
          } else {
            boItemMap.set(key, { item, qty: item.quantity });
          }
        });
      });

      const boItems = Array.from(boItemMap.values()).map(({ item, qty }, idx) => ({
        ...item,
        id: `${backorderId}-i${idx}`,
        quantity: qty,
        pickedUpQty: undefined,
        deliveredQty: undefined,
        rejectionReason: undefined,
      }));

      const boTotal = boItems.reduce((s, i) => s + i.quantity * i.price, 0);

      const boPackages: Package[] = skippedPkgs.map((pkg, idx) => ({
        ...pkg,
        id: `${backorderId}-p${idx}`,
        barcode: nextPackageBarcode(),
        status: 'pending' as const,
        skipReason: undefined,
        pickedAt: undefined,
        items: pkg.items.map((item, iIdx) => ({
          ...item,
          id: `${backorderId}-p${idx}-i${iIdx}`,
        })),
      }));

      const backorder: Order = {
        id: backorderId,
        orderNumber: `${order.orderNumber}-BO`,
        clientName: order.clientName,
        clientPhone: order.clientPhone,
        clientAddress: order.clientAddress,
        floor: order.floor,
        status: 'Assigned' as OrderStatus,
        courier: order.courier,
        courierId: order.courierId,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        paymentMethod: order.paymentMethod,
        items: boItems,
        packages: boPackages,
        total: boTotal,
        comment: `Backorder from ${order.orderNumber}. Packages not collected during initial pickup.`,
        createdAt: now,
        isBackOrder: true,
        originalOrderId: orderId,
      };

      return [backorder, ...prev.map(o => o.id === orderId ? updatedOrder : o)];
    });
  }, []);

  const confirmDelivery = useCallback((orderId: string, signature?: string, statusOverride?: OrderStatus) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: statusOverride || 'Delivered' as OrderStatus, signature } : o
    ));
  }, []);

  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'clientId'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: `cu${Date.now()}`,
      clientId: `CLN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
    };
    setCustomers(prev => [...prev, newCustomer]);
  }, []);

  const updateCustomer = useCallback((customerId: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...updates } : c));
  }, []);

  const addCourier = useCallback((courier: Omit<Courier, 'id'>) => {
    const newCourier: Courier = { ...courier, id: `c${Date.now()}` };
    setCouriers(prev => [...prev, newCourier]);
  }, []);

  const updateCourier = useCallback((courierId: string, updates: Partial<Courier>) => {
    setCouriers(prev => prev.map(c => c.id === courierId ? { ...c, ...updates } : c));
  }, []);

  const deleteCourier = useCallback((courierId: string) => {
    setCouriers(prev => prev.filter(c => c.id !== courierId));
  }, []);

  const createDeliveryRun = useCallback((run: Omit<DeliveryRun, 'id' | 'createdAt'>): DeliveryRun => {
    const newRun: DeliveryRun = {
      ...run,
      id: `run-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDeliveryRuns(prev => [newRun, ...prev]);
    // Assign all orders in the run to the driver
    run.stops.forEach(stop => {
      const courier = couriers.find(c => c.id === run.driverId);
      if (courier) {
        setOrders(prev => prev.map(o =>
          o.id === stop.orderId
            ? { ...o, courier: courier.name, courierId: courier.id, status: 'Assigned' as OrderStatus }
            : o
        ));
      }
    });
    return newRun;
  }, [couriers]);

  const updateDeliveryRun = useCallback((runId: string, updates: Partial<DeliveryRun>) => {
    setDeliveryRuns(prev => prev.map(r => r.id === runId ? { ...r, ...updates } : r));
  }, []);

  const deleteDeliveryRun = useCallback((runId: string) => {
    setDeliveryRuns(prev => prev.filter(r => r.id !== runId));
  }, []);

  return (
    <DeliveryContext.Provider value={{
      orders, couriers, items, customers, deliveryRuns,
      addOrder, updateOrderStatus, updateOrder, assignCourier, deleteOrder,
      getOrdersByStatus, getOrderById, confirmPickup, confirmDelivery,
      addCustomer, updateCustomer, addCourier, updateCourier, deleteCourier,
      createDeliveryRun, updateDeliveryRun, deleteDeliveryRun,
    }}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error('useDelivery must be used within DeliveryProvider');
  return ctx;
}
