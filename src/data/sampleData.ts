export type OrderStatus = 'New' | 'Assigned' | 'In Transit' | 'Delivered' | 'Partially Delivered' | 'Cancelled' | 'Rejected';
export type PaymentMethod = 'Cash' | 'Card' | 'Online';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  pickedUpQty?: number;
  pickupRejectionReason?: string;
  deliveredQty?: number;
  price: number;
  barcode?: string;
  scannedQty?: number;
  rejectionReason?: string;
}

export interface Package {
  id: string;
  barcode: string;       // e.g. "P-1001" — short, easy to type in demos
  items: OrderItem[];    // items physically inside this box
  status: 'pending' | 'picked' | 'skipped';
  skipReason?: string;
  pickedAt?: string;     // ISO timestamp when the driver scanned this package
}

export interface Order {
  id: string;
  orderNumber: string;
  orderBarcode?: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  floor?: string;
  status: OrderStatus;
  courier?: string;
  courierId?: string;
  deliveryDate: string;
  deliveryTime?: string;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  packages?: Package[];
  total: number;
  comment?: string;
  createdAt: string;
  pickedUp?: boolean;
  pickedUpAt?: string;        // ISO timestamp when driver confirmed pickup
  pickupPartial?: boolean;    // true if some packages were skipped at pickup
  backOrderId?: string;       // ID of the auto-created backorder (if partial)
  isBackOrder?: boolean;      // true if this order is itself a backorder
  originalOrderId?: string;   // reference to original order (for backorders)
  signature?: string;
  cashReceived?: number;
  deliveredTotal?: number;
  rejectionReason?: string;
  clientX?: number;
  clientY?: number;
}

export interface Courier {
  id: string;
  courierNumber: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  status: 'Active' | 'Inactive' | 'On Delivery';
  ordersCompleted: number;
  currentOrders: number;
  rating: number;
  successRate: number;
  isDeactivated?: boolean;
  vehiclePlate?: string;
  vehicleModel?: string;
}

export interface RouteStop {
  stopNumber: number;
  orderId: string;
  clientName: string;
  clientAddress: string;
  estimatedArrival: string;
  status: 'pending' | 'completed' | 'failed';
  x: number;
  y: number;
}

export interface DeliveryRun {
  id: string;
  runNumber: string;
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  vehicleModel: string;
  date: string;
  stops: RouteStop[];
  status: 'Planned' | 'In Progress' | 'Completed';
  createdAt: string;
  estimatedDuration: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  partNumber: string;
  barcode: string;
  uom: string;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  clientSince: string;
  lastOrder?: string;
  clientId: string;
}

// Auto-incrementing package barcode counter (starts after sample data range)
let _pkgCounter = 2001;
export const nextPackageBarcode = (): string => {
  const code = `P-${_pkgCounter}`;
  _pkgCounter++;
  return code;
};

export const sampleCouriers: Courier[] = [
  { id: 'c1', courierNumber: 'COUR-001', name: 'Alex Johnson', phone: '+1 555-0101', email: 'alex.j@delivery.com', password: 'alex2026', status: 'Active', ordersCompleted: 156, currentOrders: 3, rating: 4.8, successRate: 97, vehiclePlate: 'DXB-A-11423', vehicleModel: 'Toyota Hiace' },
  { id: 'c2', courierNumber: 'COUR-002', name: 'Maria Garcia', phone: '+1 555-0102', email: 'maria.g@delivery.com', password: 'maria2026', status: 'On Delivery', ordersCompleted: 203, currentOrders: 5, rating: 4.9, successRate: 99, vehiclePlate: 'DXB-B-22187', vehicleModel: 'Mitsubishi Canter' },
  { id: 'c3', courierNumber: 'COUR-003', name: 'James Wilson', phone: '+1 555-0103', email: 'james.w@delivery.com', password: 'james2026', status: 'Active', ordersCompleted: 89, currentOrders: 2, rating: 4.2, successRate: 91, vehiclePlate: 'DXB-C-33901', vehicleModel: 'Toyota Hiace' },
  { id: 'c4', courierNumber: 'COUR-004', name: 'Sarah Chen', phone: '+1 555-0104', email: 'sarah.c@delivery.com', password: 'sarah2026', status: 'Inactive', ordersCompleted: 45, currentOrders: 0, rating: 3.8, successRate: 85, isDeactivated: true, vehiclePlate: 'DXB-D-44512', vehicleModel: 'Ford Transit' },
  { id: 'c5', courierNumber: 'COUR-005', name: 'David Kim', phone: '+1 555-0105', email: 'david.k@delivery.com', password: 'david2026', status: 'Active', ordersCompleted: 312, currentOrders: 4, rating: 4.95, successRate: 98, vehiclePlate: 'DXB-E-55674', vehicleModel: 'Mitsubishi Canter' },
  { id: 'c6', courierNumber: 'COUR-006', name: 'Rachel Torres', phone: '+1 555-0106', password: 'rachel2026', status: 'Active', ordersCompleted: 78, currentOrders: 2, rating: 4.5, successRate: 94, vehiclePlate: 'DXB-F-66839', vehicleModel: 'Ford Transit' },
];

export const sampleItems: InventoryItem[] = [
  { id: 'i1', name: 'Air Conditioner Sanyo', partNumber: 'AC-SNY-001', barcode: '4901660123456', uom: 'pcs', price: 450.00 },
  { id: 'i2', name: 'BOSCH Drill Machine', partNumber: 'BM-BSH-002', barcode: '4054628001234', uom: 'pcs', price: 120.00 },
  { id: 'i3', name: 'Buckwheat groats', partNumber: 'FD-BWG-003', barcode: '4607011585678', uom: 'kg', price: 3.50 },
  { id: 'i4', name: 'Samsung Galaxy S24', partNumber: 'PH-SGS-004', barcode: '8806095012345', uom: 'pcs', price: 899.00 },
  { id: 'i5', name: 'Nike Running Shoes', partNumber: 'SH-NKR-005', barcode: '0194501234567', uom: 'pair', price: 129.99 },
  { id: 'i6', name: 'Organic Olive Oil 1L', partNumber: 'FD-OOL-006', barcode: '8410660123456', uom: 'bottle', price: 12.99 },
  { id: 'i7', name: 'LEGO Star Wars Set', partNumber: 'TY-LSW-007', barcode: '5702016912345', uom: 'pcs', price: 79.99 },
  { id: 'i8', name: 'Logitech MX Master 3', partNumber: 'PC-LMM-008', barcode: '5099206012345', uom: 'pcs', price: 99.99 },
];

export const sampleCustomers: Customer[] = [
  { id: 'cu1', name: 'Robert Brown', phone: '+1 555-1001', email: 'robert.b@email.com', address: '123 Main St, Apt 4B', city: 'New York', ordersCount: 12, totalSpent: 2450.00, clientSince: '2024-06-15', lastOrder: 'ORD-2024-008', clientId: 'CLN-20240615-1001' },
  { id: 'cu2', name: 'Emily Davis', phone: '+1 555-1002', email: 'emily.d@email.com', address: '456 Oak Avenue, Suite 200', city: 'Los Angeles', ordersCount: 8, totalSpent: 1890.00, clientSince: '2024-07-20', lastOrder: 'ORD-2024-007', clientId: 'CLN-20240720-1002' },
  { id: 'cu3', name: 'Michael Thompson', phone: '+1 555-1003', email: 'michael.t@email.com', address: '789 Pine Road', city: 'Chicago', ordersCount: 23, totalSpent: 5670.00, clientSince: '2024-03-10', lastOrder: 'ORD-2024-003', clientId: 'CLN-20240310-1003' },
  { id: 'cu4', name: 'Lisa Anderson', phone: '+1 555-1004', email: 'lisa.a@email.com', address: '321 Elm Street, Floor 3', city: 'Houston', ordersCount: 5, totalSpent: 890.00, clientSince: '2024-09-01', lastOrder: 'ORD-2024-009', clientId: 'CLN-20240901-1004' },
  { id: 'cu5', name: 'William Martinez', phone: '+1 555-1005', email: 'william.m@email.com', address: '654 Cedar Lane', city: 'Phoenix', ordersCount: 17, totalSpent: 3200.00, clientSince: '2024-04-22', lastOrder: 'ORD-2024-010', clientId: 'CLN-20240422-1005' },
];

export const sampleOrders: Order[] = [
  {
    id: 'o1', orderNumber: 'ORD-2026-001', clientName: 'Robert Brown', clientPhone: '+1 555-1001',
    clientAddress: '123 Main St, Apt 4B', floor: '4', status: 'New', deliveryDate: '2026-03-09',
    deliveryTime: '10:00-12:00', paymentMethod: 'Cash',
    items: [
      { id: 'oi1', name: 'Air Conditioner Sanyo', quantity: 1, price: 450.00, barcode: '4901660123456' },
      { id: 'oi2', name: 'BOSCH Drill Machine', quantity: 2, price: 120.00, barcode: '4054628001234' },
    ],
    packages: [
      {
        id: 'pkg-o1-1', barcode: 'P-1001', status: 'pending',
        items: [
          { id: 'oi1', name: 'Air Conditioner Sanyo', quantity: 1, price: 450.00, barcode: '4901660123456' },
          { id: 'oi2', name: 'BOSCH Drill Machine', quantity: 2, price: 120.00, barcode: '4054628001234' },
        ],
      },
    ],
    total: 690.00, comment: 'Call before delivery', createdAt: '2026-03-09T09:00:00Z', clientX: 25, clientY: 50,
  },
  {
    // Assigned — appears in driver pickup list; 1 package
    id: 'o2', orderNumber: 'ORD-2026-002', clientName: 'Emily Davis', clientPhone: '+1 555-1002',
    clientAddress: '456 Oak Avenue, Suite 200', status: 'Assigned', courier: 'Alex Johnson', courierId: 'c1',
    deliveryDate: '2026-03-09', deliveryTime: '14:00-16:00', paymentMethod: 'Card',
    items: [{ id: 'oi3', name: 'Samsung Galaxy S24', quantity: 1, price: 899.00, barcode: '8806095012345' }],
    packages: [
      {
        id: 'pkg-o2-1', barcode: 'P-1002', status: 'pending',
        items: [{ id: 'oi3', name: 'Samsung Galaxy S24', quantity: 1, price: 899.00, barcode: '8806095012345' }],
      },
    ],
    total: 899.00, createdAt: '2026-03-09T10:30:00Z', clientX: 52, clientY: 27,
  },
  {
    id: 'o3', orderNumber: 'ORD-2026-003', clientName: 'Michael Thompson', clientPhone: '+1 555-1003',
    clientAddress: '789 Pine Road', status: 'In Transit', courier: 'Maria Garcia', courierId: 'c2',
    deliveryDate: '2026-03-09', deliveryTime: '09:00-11:00', paymentMethod: 'Online',
    items: [
      { id: 'oi4', name: 'Nike Running Shoes', quantity: 1, price: 129.99, barcode: '0194501234567' },
      { id: 'oi5', name: 'Logitech MX Master 3', quantity: 1, price: 99.99, barcode: '5099206012345' },
    ],
    packages: [
      {
        id: 'pkg-o3-1', barcode: 'P-1003', status: 'picked', pickedAt: '2026-03-09T07:45:00Z',
        items: [
          { id: 'oi4', name: 'Nike Running Shoes', quantity: 1, price: 129.99, barcode: '0194501234567' },
          { id: 'oi5', name: 'Logitech MX Master 3', quantity: 1, price: 99.99, barcode: '5099206012345' },
        ],
      },
    ],
    total: 229.98, createdAt: '2026-03-09T08:00:00Z', clientX: 73, clientY: 38,
    pickedUp: true, pickedUpAt: '2026-03-09T07:46:00Z', pickupPartial: false,
  },
  {
    id: 'o4', orderNumber: 'ORD-2026-004', clientName: 'Lisa Anderson', clientPhone: '+1 555-1004',
    clientAddress: '321 Elm Street, Floor 3', floor: '3', status: 'Delivered', courier: 'James Wilson', courierId: 'c3',
    deliveryDate: '2026-03-09', paymentMethod: 'Cash',
    items: [{ id: 'oi6', name: 'Organic Olive Oil 1L', quantity: 5, price: 12.99, barcode: '8410660123456' }],
    packages: [
      {
        id: 'pkg-o4-1', barcode: 'P-1004', status: 'picked', pickedAt: '2026-03-09T06:50:00Z',
        items: [{ id: 'oi6', name: 'Organic Olive Oil 1L', quantity: 5, price: 12.99, barcode: '8410660123456' }],
      },
    ],
    total: 64.95, createdAt: '2026-03-09T07:00:00Z', clientX: 82, clientY: 63,
    pickedUp: true, pickedUpAt: '2026-03-09T06:51:00Z', pickupPartial: false,
    signature: 'data:signed',
  },
  {
    id: 'o5', orderNumber: 'ORD-2026-005', clientName: 'William Martinez', clientPhone: '+1 555-1005',
    clientAddress: '654 Cedar Lane', status: 'Cancelled', deliveryDate: '2026-03-09', paymentMethod: 'Card',
    items: [{ id: 'oi7', name: 'LEGO Star Wars Set', quantity: 2, price: 79.99, barcode: '5702016912345' }],
    packages: [
      {
        id: 'pkg-o5-1', barcode: 'P-1005', status: 'pending',
        items: [{ id: 'oi7', name: 'LEGO Star Wars Set', quantity: 2, price: 79.99, barcode: '5702016912345' }],
      },
    ],
    total: 159.98, comment: 'Customer cancelled', createdAt: '2026-03-09T06:00:00Z', clientX: 60, clientY: 77,
  },
  {
    id: 'o6', orderNumber: 'ORD-2026-006', clientName: 'Robert Brown', clientPhone: '+1 555-1001',
    clientAddress: '123 Main St, Apt 4B', status: 'New', deliveryDate: '2026-03-09',
    deliveryTime: '16:00-18:00', paymentMethod: 'Online',
    items: [{ id: 'oi8', name: 'Buckwheat groats', quantity: 10, price: 3.50, barcode: '4607011585678' }],
    packages: [
      {
        id: 'pkg-o6-1', barcode: 'P-1006', status: 'pending',
        items: [{ id: 'oi8', name: 'Buckwheat groats', quantity: 10, price: 3.50, barcode: '4607011585678' }],
      },
    ],
    total: 35.00, createdAt: '2026-03-09T07:00:00Z', clientX: 25, clientY: 50,
  },
  {
    id: 'o7', orderNumber: 'ORD-2026-007', clientName: 'Emily Davis', clientPhone: '+1 555-1002',
    clientAddress: '456 Oak Avenue, Suite 200', status: 'In Transit', courier: 'David Kim', courierId: 'c5',
    deliveryDate: '2026-03-09', paymentMethod: 'Cash',
    items: [
      { id: 'oi9', name: 'Air Conditioner Sanyo', quantity: 1, price: 450.00, barcode: '4901660123456' },
      { id: 'oi10', name: 'Organic Olive Oil 1L', quantity: 3, price: 12.99, barcode: '8410660123456' },
    ],
    packages: [
      {
        id: 'pkg-o7-1', barcode: 'P-1007', status: 'picked', pickedAt: '2026-03-09T07:55:00Z',
        items: [
          { id: 'oi9', name: 'Air Conditioner Sanyo', quantity: 1, price: 450.00, barcode: '4901660123456' },
          { id: 'oi10', name: 'Organic Olive Oil 1L', quantity: 3, price: 12.99, barcode: '8410660123456' },
        ],
      },
    ],
    total: 488.97, createdAt: '2026-03-09T08:00:00Z', clientX: 52, clientY: 27,
    pickedUp: true, pickedUpAt: '2026-03-09T07:56:00Z', pickupPartial: false,
  },
  {
    id: 'o8', orderNumber: 'ORD-2026-008', clientName: 'Michael Thompson', clientPhone: '+1 555-1003',
    clientAddress: '789 Pine Road', status: 'Delivered', courier: 'Alex Johnson', courierId: 'c1',
    deliveryDate: '2026-03-09', paymentMethod: 'Card',
    items: [{ id: 'oi11', name: 'BOSCH Drill Machine', quantity: 1, price: 120.00, barcode: '4054628001234' }],
    packages: [
      {
        id: 'pkg-o8-1', barcode: 'P-1008', status: 'picked', pickedAt: '2026-03-09T06:40:00Z',
        items: [{ id: 'oi11', name: 'BOSCH Drill Machine', quantity: 1, price: 120.00, barcode: '4054628001234' }],
      },
    ],
    total: 120.00, createdAt: '2026-03-09T06:00:00Z', clientX: 73, clientY: 38,
    pickedUp: true, pickedUpAt: '2026-03-09T06:41:00Z', pickupPartial: false,
    signature: 'data:signed',
  },
  {
    // Assigned — appears in driver pickup list; 2 packages (good multi-package demo)
    id: 'o9', orderNumber: 'ORD-2026-009', clientName: 'Lisa Anderson', clientPhone: '+1 555-1004',
    clientAddress: '321 Elm Street, Floor 3', status: 'Assigned', courier: 'Maria Garcia', courierId: 'c2',
    deliveryDate: '2026-03-09', deliveryTime: '11:00-13:00', paymentMethod: 'Online',
    items: [{ id: 'oi12', name: 'Samsung Galaxy S24', quantity: 2, price: 899.00, barcode: '8806095012345' }],
    packages: [
      {
        id: 'pkg-o9-1', barcode: 'P-1009', status: 'pending',
        items: [{ id: 'oi12a', name: 'Samsung Galaxy S24', quantity: 1, price: 899.00, barcode: '8806095012345' }],
      },
      {
        id: 'pkg-o9-2', barcode: 'P-1010', status: 'pending',
        items: [{ id: 'oi12b', name: 'Samsung Galaxy S24', quantity: 1, price: 899.00, barcode: '8806095012345' }],
      },
    ],
    total: 1798.00, createdAt: '2026-03-09T09:00:00Z', clientX: 82, clientY: 63,
  },
  {
    id: 'o10', orderNumber: 'ORD-2026-010', clientName: 'William Martinez', clientPhone: '+1 555-1005',
    clientAddress: '654 Cedar Lane', status: 'New', deliveryDate: '2026-03-09', paymentMethod: 'Cash',
    items: [
      { id: 'oi13', name: 'Logitech MX Master 3', quantity: 2, price: 99.99, barcode: '5099206012345' },
      { id: 'oi14', name: 'Nike Running Shoes', quantity: 1, price: 129.99, barcode: '0194501234567' },
    ],
    packages: [
      {
        id: 'pkg-o10-1', barcode: 'P-1011', status: 'pending',
        items: [
          { id: 'oi13', name: 'Logitech MX Master 3', quantity: 2, price: 99.99, barcode: '5099206012345' },
          { id: 'oi14', name: 'Nike Running Shoes', quantity: 1, price: 129.99, barcode: '0194501234567' },
        ],
      },
    ],
    total: 329.97, createdAt: '2026-03-09T10:00:00Z', clientX: 60, clientY: 77,
  },
];

// Depot position on the mock map (x, y in 0-100 coordinate space)
export const DEPOT_POSITION = { x: 12, y: 80 };

// Per-client mock coordinates — used for map dots and clustering
export const CLIENT_COORDS: Record<string, { x: number; y: number }> = {
  'Robert Brown':      { x: 25, y: 50 },
  'Emily Davis':       { x: 52, y: 27 },
  'Michael Thompson':  { x: 73, y: 38 },
  'Lisa Anderson':     { x: 82, y: 63 },
  'William Martinez':  { x: 60, y: 77 },
};

export const sampleDeliveryRuns: DeliveryRun[] = [
  {
    id: 'run-1',
    runNumber: 'RUN-2026-001',
    driverId: 'c2',
    driverName: 'Maria Garcia',
    vehiclePlate: 'DXB-B-22187',
    vehicleModel: 'Mitsubishi Canter',
    date: '2026-03-09',
    status: 'In Progress',
    createdAt: '2026-03-09T07:00:00Z',
    estimatedDuration: '4h 15m',
    stops: [
      { stopNumber: 1, orderId: 'o3',  clientName: 'Michael Thompson', clientAddress: '789 Pine Road',              estimatedArrival: '08:30', status: 'completed', x: 32, y: 52 },
      { stopNumber: 2, orderId: 'o7',  clientName: 'Emily Davis',       clientAddress: '456 Oak Avenue, Suite 200', estimatedArrival: '09:15', status: 'completed', x: 52, y: 30 },
      { stopNumber: 3, orderId: 'o9',  clientName: 'Lisa Anderson',     clientAddress: '321 Elm Street, Floor 3',   estimatedArrival: '10:20', status: 'pending',   x: 72, y: 22 },
      { stopNumber: 4, orderId: 'o4',  clientName: 'Lisa Anderson',     clientAddress: '321 Elm Street, Floor 3',   estimatedArrival: '11:30', status: 'pending',   x: 82, y: 52 },
    ],
  },
  {
    id: 'run-2',
    runNumber: 'RUN-2026-002',
    driverId: 'c1',
    driverName: 'Alex Johnson',
    vehiclePlate: 'DXB-A-11423',
    vehicleModel: 'Toyota Hiace',
    date: '2026-03-09',
    status: 'Planned',
    createdAt: '2026-03-09T08:30:00Z',
    estimatedDuration: '3h 45m',
    stops: [
      { stopNumber: 1, orderId: 'o2',  clientName: 'Emily Davis',       clientAddress: '456 Oak Avenue, Suite 200', estimatedArrival: '10:00', status: 'pending', x: 38, y: 42 },
      { stopNumber: 2, orderId: 'o8',  clientName: 'Michael Thompson',  clientAddress: '789 Pine Road',             estimatedArrival: '11:00', status: 'pending', x: 60, y: 28 },
      { stopNumber: 3, orderId: 'o1',  clientName: 'Robert Brown',      clientAddress: '123 Main St, Apt 4B',       estimatedArrival: '12:15', status: 'pending', x: 78, y: 48 },
    ],
  },
  {
    id: 'run-3',
    runNumber: 'RUN-2026-003',
    driverId: 'c5',
    driverName: 'David Kim',
    vehiclePlate: 'DXB-E-55674',
    vehicleModel: 'Mitsubishi Canter',
    date: '2026-03-09',
    status: 'Completed',
    createdAt: '2026-03-09T06:00:00Z',
    estimatedDuration: '2h 50m',
    stops: [
      { stopNumber: 1, orderId: 'o5',  clientName: 'William Martinez',  clientAddress: '654 Cedar Lane',            estimatedArrival: '07:00', status: 'completed', x: 45, y: 60 },
      { stopNumber: 2, orderId: 'o6',  clientName: 'Robert Brown',      clientAddress: '123 Main St, Apt 4B',       estimatedArrival: '07:55', status: 'completed', x: 65, y: 42 },
      { stopNumber: 3, orderId: 'o10', clientName: 'William Martinez',  clientAddress: '654 Cedar Lane',            estimatedArrival: '08:50', status: 'completed', x: 78, y: 68 },
    ],
  },
];
