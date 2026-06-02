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
  lat?: number;
  lng?: number;
  deliveredAt?: string;
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
  deliveredAt?: string;
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
  { id: 'c1', courierNumber: 'COUR-001', name: 'Alex Johnson',   phone: '+971 50 111 0101', email: 'alex.j@delivery.ae',   password: 'alex2026',   status: 'Active',      ordersCompleted: 156, currentOrders: 0, rating: 4.8, successRate: 97, vehiclePlate: 'DXB-A-11423', vehicleModel: 'Toyota Hiace' },
  { id: 'c2', courierNumber: 'COUR-002', name: 'Maria Garcia',   phone: '+971 50 111 0102', email: 'maria.g@delivery.ae',  password: 'maria2026',  status: 'On Delivery', ordersCompleted: 203, currentOrders: 2, rating: 4.9, successRate: 99, vehiclePlate: 'DXB-B-22187', vehicleModel: 'Mitsubishi Canter' },
  { id: 'c3', courierNumber: 'COUR-003', name: 'James Wilson',   phone: '+971 50 111 0103', email: 'james.w@delivery.ae',  password: 'james2026',  status: 'Active',      ordersCompleted: 89,  currentOrders: 0, rating: 4.2, successRate: 91, vehiclePlate: 'DXB-C-33901', vehicleModel: 'Toyota Hiace' },
  { id: 'c4', courierNumber: 'COUR-004', name: 'Sarah Chen',     phone: '+971 50 111 0104', email: 'sarah.c@delivery.ae',  password: 'sarah2026',  status: 'Inactive',    ordersCompleted: 45,  currentOrders: 0, rating: 3.8, successRate: 85, isDeactivated: true, vehiclePlate: 'DXB-D-44512', vehicleModel: 'Ford Transit' },
  { id: 'c5', courierNumber: 'COUR-005', name: 'David Kim',      phone: '+971 50 111 0105', email: 'david.k@delivery.ae',  password: 'david2026',  status: 'Active',      ordersCompleted: 312, currentOrders: 0, rating: 4.95, successRate: 98, vehiclePlate: 'DXB-E-55674', vehicleModel: 'Mitsubishi Canter' },
  { id: 'c6', courierNumber: 'COUR-006', name: 'Rachel Torres',  phone: '+971 50 111 0106',                                password: 'rachel2026', status: 'Active',      ordersCompleted: 78,  currentOrders: 0, rating: 4.5,  successRate: 94, vehiclePlate: 'DXB-F-66839', vehicleModel: 'Ford Transit' },
];

export const sampleItems: InventoryItem[] = [
  { id: 'i1', name: 'Air Conditioner Sanyo 18K BTU', partNumber: 'AC-SNY-001', barcode: '4901660123456', uom: 'pcs', price: 1350.00 },
  { id: 'i2', name: 'BOSCH Cordless Drill Set',       partNumber: 'BM-BSH-002', barcode: '4054628001234', uom: 'pcs', price: 450.00 },
  { id: 'i3', name: 'Printer Paper A4 (500 sheets)',  partNumber: 'OF-PPA-003', barcode: '4607011585678', uom: 'ream', price: 18.00 },
  { id: 'i4', name: 'Samsung Galaxy S25',             partNumber: 'PH-SGS-004', barcode: '8806095012345', uom: 'pcs', price: 1299.00 },
  { id: 'i5', name: 'Nike Air Max Running Shoes',     partNumber: 'SH-NKR-005', barcode: '0194501234567', uom: 'pair', price: 380.00 },
  { id: 'i6', name: 'Nescafé Gold 200g',              partNumber: 'FD-NCG-006', barcode: '8410660123456', uom: 'jar', price: 32.50 },
  { id: 'i7', name: 'Dyson V15 Vacuum Cleaner',       partNumber: 'HH-DYS-007', barcode: '5702016912345', uom: 'pcs', price: 2200.00 },
  { id: 'i8', name: 'Logitech MX Master 3S Mouse',    partNumber: 'PC-LMM-008', barcode: '5099206012345', uom: 'pcs', price: 220.00 },
  { id: 'i9', name: 'Instant Pot Duo 7-in-1',         partNumber: 'KT-IPD-009', barcode: '6931706980349', uom: 'pcs', price: 490.00 },
  { id: 'i10', name: 'IKEA Billy Bookcase 80cm',      partNumber: 'FN-IKB-010', barcode: '7332623490012', uom: 'pcs', price: 265.00 },
];

export const sampleCustomers: Customer[] = [
  { id: 'cu1',  name: 'Ahmed Al Rashidi',    phone: '+971 55 201 4401', email: 'ahmed.rashidi@gmail.com',   address: 'Tower A, Marina Walk',           city: 'Dubai Marina',       ordersCount: 7,  totalSpent: 8420.00, clientSince: '2024-02-10', clientId: 'CLN-20240210-0001' },
  { id: 'cu2',  name: 'Priya Sharma',        phone: '+971 55 201 4402', email: 'priya.sharma@hotmail.com',  address: 'Unit 405, The Walk Tower 7',     city: 'JBR',                ordersCount: 4,  totalSpent: 3190.00, clientSince: '2024-05-18', clientId: 'CLN-20240518-0002' },
  { id: 'cu3',  name: 'Carlos Rivera',       phone: '+971 55 201 4403', email: 'carlos.r@empresa.com',      address: 'Villa 14, Street 18C, Al Safa',  city: 'Jumeirah',           ordersCount: 12, totalSpent: 15600.00,clientSince: '2023-11-01', clientId: 'CLN-20231101-0003' },
  { id: 'cu4',  name: 'Elena Petrova',       phone: '+971 55 201 4404', email: 'elena.petrova@mail.ru',     address: 'Emaar Blvd, Downtown Dubai',     city: 'Downtown',           ordersCount: 9,  totalSpent: 11250.00,clientSince: '2024-01-22', clientId: 'CLN-20240122-0004' },
  { id: 'cu5',  name: 'Mohammed Al Farsi',   phone: '+971 55 201 4405', email: 'm.alfarsi@corp.ae',         address: 'Bay Square Bldg 3, Business Bay', city: 'Business Bay',      ordersCount: 18, totalSpent: 23800.00,clientSince: '2023-09-14', clientId: 'CLN-20230914-0005' },
  { id: 'cu6',  name: 'Jessica Wong',        phone: '+971 55 201 4406', email: 'jessica.w@outlook.com',     address: 'Al Mankhool Road, Apt 2B',       city: 'Bur Dubai',          ordersCount: 5,  totalSpent: 4360.00, clientSince: '2024-04-03', clientId: 'CLN-20240403-0006' },
  { id: 'cu7',  name: 'Omar Hassan',         phone: '+971 55 201 4407', email: 'omar.hassan@yahoo.com',     address: 'Al Rigga Street, Shop 12',       city: 'Deira',              ordersCount: 22, totalSpent: 19700.00,clientSince: '2023-07-30', clientId: 'CLN-20230730-0007' },
  { id: 'cu8',  name: 'Fatima Al Zaabi',     phone: '+971 55 201 4408', email: 'fatima.alzaabi@gmail.com',  address: 'Al Qusais Industrial 2, St 8',   city: 'Al Qusais',          ordersCount: 3,  totalSpent: 2100.00, clientSince: '2024-08-11', clientId: 'CLN-20240811-0008' },
  { id: 'cu9',  name: 'Rajesh Patel',        phone: '+971 55 201 4409', email: 'rajesh.p@techco.in',        address: 'Persia Cluster A15',             city: 'International City', ordersCount: 14, totalSpent: 9870.00, clientSince: '2024-03-05', clientId: 'CLN-20240305-0009' },
  { id: 'cu10', name: 'Sarah Mitchell',      phone: '+971 55 201 4410', email: 's.mitchell@agency.com',     address: 'Al Barsha 1, near Mall of Emirates', city: 'Al Barsha',     ordersCount: 8,  totalSpent: 6540.00, clientSince: '2024-06-20', clientId: 'CLN-20240620-0010' },
];

// ─── TODAY'S DATE HELPER ────────────────────────────────────────────────────
const TODAY = '2026-06-02';
function ts(time: string) { return `${TODAY}T${time}:00Z`; }

export const sampleOrders: Order[] = [
  // ── 10 NEW orders waiting to be assigned (spread across Dubai) ──────────

  // WEST CLUSTER — Dubai Marina / JBR / Jumeirah / Al Barsha
  {
    id: 'n1', orderNumber: 'ORD-2026-001', clientName: 'Ahmed Al Rashidi', clientPhone: '+971 55 201 4401',
    clientAddress: 'Tower A, Marina Walk, Dubai Marina', status: 'New',
    deliveryDate: TODAY, deliveryTime: '10:00-12:00', paymentMethod: 'Cash',
    items: [{ id: 'n1i1', name: 'Air Conditioner Sanyo 18K BTU', quantity: 1, price: 1350.00, barcode: '4901660123456' }],
    packages: [{ id: 'n1p1', barcode: 'P-2001', status: 'pending', items: [{ id: 'n1i1', name: 'Air Conditioner Sanyo 18K BTU', quantity: 1, price: 1350.00, barcode: '4901660123456' }] }],
    total: 1350.00, createdAt: ts('05:30'), lat: 25.0794, lng: 55.1332,
  },
  {
    id: 'n2', orderNumber: 'ORD-2026-002', clientName: 'Priya Sharma', clientPhone: '+971 55 201 4402',
    clientAddress: 'Unit 405, The Walk Tower 7, JBR', status: 'New',
    deliveryDate: TODAY, deliveryTime: '09:00-11:00', paymentMethod: 'Card',
    items: [
      { id: 'n2i1', name: 'Dyson V15 Vacuum Cleaner',    quantity: 1, price: 2200.00, barcode: '5702016912345' },
      { id: 'n2i2', name: 'Nescafé Gold 200g',           quantity: 3, price: 32.50,   barcode: '8410660123456' },
    ],
    packages: [{ id: 'n2p1', barcode: 'P-2002', status: 'pending', items: [{ id: 'n2i1', name: 'Dyson V15 Vacuum Cleaner', quantity: 1, price: 2200.00, barcode: '5702016912345' }, { id: 'n2i2', name: 'Nescafé Gold 200g', quantity: 3, price: 32.50, barcode: '8410660123456' }] }],
    total: 2297.50, createdAt: ts('05:55'), lat: 25.0894, lng: 55.1410,
  },
  {
    id: 'n3', orderNumber: 'ORD-2026-003', clientName: 'Carlos Rivera', clientPhone: '+971 55 201 4403',
    clientAddress: 'Villa 14, Street 18C, Al Safa, Jumeirah', status: 'New',
    deliveryDate: TODAY, deliveryTime: '12:00-14:00', paymentMethod: 'Online',
    items: [{ id: 'n3i1', name: 'IKEA Billy Bookcase 80cm', quantity: 2, price: 265.00, barcode: '7332623490012' }],
    packages: [{ id: 'n3p1', barcode: 'P-2003', status: 'pending', items: [{ id: 'n3i1', name: 'IKEA Billy Bookcase 80cm', quantity: 2, price: 265.00, barcode: '7332623490012' }] }],
    total: 530.00, comment: 'Leave at gate if no answer', createdAt: ts('06:20'), lat: 25.2028, lng: 55.2406,
  },
  {
    id: 'n4', orderNumber: 'ORD-2026-004', clientName: 'Sarah Mitchell', clientPhone: '+971 55 201 4410',
    clientAddress: 'Al Barsha 1, near Mall of Emirates, Dubai', status: 'New',
    deliveryDate: TODAY, deliveryTime: '14:00-16:00', paymentMethod: 'Cash',
    items: [
      { id: 'n4i1', name: 'Nike Air Max Running Shoes',  quantity: 1, price: 380.00, barcode: '0194501234567' },
      { id: 'n4i2', name: 'Logitech MX Master 3S Mouse', quantity: 1, price: 220.00, barcode: '5099206012345' },
    ],
    packages: [{ id: 'n4p1', barcode: 'P-2004', status: 'pending', items: [{ id: 'n4i1', name: 'Nike Air Max Running Shoes', quantity: 1, price: 380.00, barcode: '0194501234567' }, { id: 'n4i2', name: 'Logitech MX Master 3S Mouse', quantity: 1, price: 220.00, barcode: '5099206012345' }] }],
    total: 600.00, createdAt: ts('06:45'), lat: 25.1089, lng: 55.2004,
  },

  // CENTRAL CLUSTER — Downtown / Business Bay / Bur Dubai
  {
    id: 'n5', orderNumber: 'ORD-2026-005', clientName: 'Elena Petrova', clientPhone: '+971 55 201 4404',
    clientAddress: 'Emaar Boulevard, Downtown Dubai', status: 'New',
    deliveryDate: TODAY, deliveryTime: '11:00-13:00', paymentMethod: 'Card',
    items: [{ id: 'n5i1', name: 'Samsung Galaxy S25', quantity: 2, price: 1299.00, barcode: '8806095012345' }],
    packages: [
      { id: 'n5p1', barcode: 'P-2005', status: 'pending', items: [{ id: 'n5i1a', name: 'Samsung Galaxy S25', quantity: 1, price: 1299.00, barcode: '8806095012345' }] },
      { id: 'n5p2', barcode: 'P-2006', status: 'pending', items: [{ id: 'n5i1b', name: 'Samsung Galaxy S25', quantity: 1, price: 1299.00, barcode: '8806095012345' }] },
    ],
    total: 2598.00, createdAt: ts('07:30'), lat: 25.1972, lng: 55.2744,
  },
  {
    id: 'n6', orderNumber: 'ORD-2026-006', clientName: 'Mohammed Al Farsi', clientPhone: '+971 55 201 4405',
    clientAddress: 'Bay Square Building 3, Business Bay, Dubai', status: 'New',
    deliveryDate: TODAY, deliveryTime: '13:00-15:00', paymentMethod: 'Online',
    items: [
      { id: 'n6i1', name: 'Instant Pot Duo 7-in-1',     quantity: 1, price: 490.00, barcode: '6931706980349' },
      { id: 'n6i2', name: 'BOSCH Cordless Drill Set',    quantity: 1, price: 450.00, barcode: '4054628001234' },
    ],
    packages: [{ id: 'n6p1', barcode: 'P-2007', status: 'pending', items: [{ id: 'n6i1', name: 'Instant Pot Duo 7-in-1', quantity: 1, price: 490.00, barcode: '6931706980349' }, { id: 'n6i2', name: 'BOSCH Cordless Drill Set', quantity: 1, price: 450.00, barcode: '4054628001234' }] }],
    total: 940.00, createdAt: ts('08:15'), lat: 25.1872, lng: 55.2741,
  },
  {
    id: 'n7', orderNumber: 'ORD-2026-007', clientName: 'Jessica Wong', clientPhone: '+971 55 201 4406',
    clientAddress: 'Al Mankhool Road, Apt 2B, Bur Dubai', status: 'New',
    deliveryDate: TODAY, deliveryTime: '10:00-12:00', paymentMethod: 'Cash',
    items: [{ id: 'n7i1', name: 'Printer Paper A4 (500 sheets)', quantity: 10, price: 18.00, barcode: '4607011585678' }],
    packages: [{ id: 'n7p1', barcode: 'P-2008', status: 'pending', items: [{ id: 'n7i1', name: 'Printer Paper A4 (500 sheets)', quantity: 10, price: 18.00, barcode: '4607011585678' }] }],
    total: 180.00, createdAt: ts('06:10'), lat: 25.2532, lng: 55.2894,
  },

  // EAST CLUSTER — Deira / Al Qusais / International City
  {
    id: 'n8', orderNumber: 'ORD-2026-008', clientName: 'Omar Hassan', clientPhone: '+971 55 201 4407',
    clientAddress: 'Al Rigga Street, Shop 12, Deira, Dubai', status: 'New',
    deliveryDate: TODAY, deliveryTime: '15:00-17:00', paymentMethod: 'Card',
    items: [{ id: 'n8i1', name: 'Air Conditioner Sanyo 18K BTU', quantity: 1, price: 1350.00, barcode: '4901660123456' }],
    packages: [{ id: 'n8p1', barcode: 'P-2009', status: 'pending', items: [{ id: 'n8i1', name: 'Air Conditioner Sanyo 18K BTU', quantity: 1, price: 1350.00, barcode: '4901660123456' }] }],
    total: 1350.00, createdAt: ts('10:45'), lat: 25.2697, lng: 55.3120,
  },
  {
    id: 'n9', orderNumber: 'ORD-2026-009', clientName: 'Fatima Al Zaabi', clientPhone: '+971 55 201 4408',
    clientAddress: 'Al Qusais Industrial Area 2, Street 8, Dubai', status: 'New',
    deliveryDate: TODAY, deliveryTime: '14:00-16:00', paymentMethod: 'Online',
    items: [
      { id: 'n9i1', name: 'IKEA Billy Bookcase 80cm',   quantity: 3, price: 265.00, barcode: '7332623490012' },
      { id: 'n9i2', name: 'Nescafé Gold 200g',          quantity: 6, price: 32.50,  barcode: '8410660123456' },
    ],
    packages: [{ id: 'n9p1', barcode: 'P-2010', status: 'pending', items: [{ id: 'n9i1', name: 'IKEA Billy Bookcase 80cm', quantity: 3, price: 265.00, barcode: '7332623490012' }, { id: 'n9i2', name: 'Nescafé Gold 200g', quantity: 6, price: 32.50, barcode: '8410660123456' }] }],
    total: 990.00, createdAt: ts('11:10'), lat: 25.2736, lng: 55.3756,
  },
  {
    id: 'n10', orderNumber: 'ORD-2026-010', clientName: 'Rajesh Patel', clientPhone: '+971 55 201 4409',
    clientAddress: 'Persia Cluster A15, International City, Dubai', status: 'New',
    deliveryDate: TODAY, deliveryTime: '16:00-18:00', paymentMethod: 'Cash',
    items: [
      { id: 'n10i1', name: 'Logitech MX Master 3S Mouse', quantity: 2, price: 220.00, barcode: '5099206012345' },
      { id: 'n10i2', name: 'Printer Paper A4 (500 sheets)', quantity: 5, price: 18.00, barcode: '4607011585678' },
    ],
    packages: [{ id: 'n10p1', barcode: 'P-2011', status: 'pending', items: [{ id: 'n10i1', name: 'Logitech MX Master 3S Mouse', quantity: 2, price: 220.00, barcode: '5099206012345' }, { id: 'n10i2', name: 'Printer Paper A4 (500 sheets)', quantity: 5, price: 18.00, barcode: '4607011585678' }] }],
    total: 530.00, comment: 'Call on arrival', createdAt: ts('11:45'), lat: 25.1652, lng: 55.4113,
  },

  // ── ACTIVE runs (for mobile emulator demo) ────────────────────────────────
  {
    id: 'a1', orderNumber: 'ORD-2026-011', clientName: 'Carlos Rivera', clientPhone: '+971 55 201 4403',
    clientAddress: 'Villa 8, Street 12B, Jumeirah 3, Dubai', status: 'In Transit',
    courier: 'Maria Garcia', courierId: 'c2',
    deliveryDate: TODAY, deliveryTime: '09:00-11:00', paymentMethod: 'Cash',
    items: [{ id: 'a1i1', name: 'Samsung Galaxy S25', quantity: 1, price: 1299.00, barcode: '8806095012345' }],
    packages: [{ id: 'a1p1', barcode: 'P-2012', status: 'picked', pickedAt: ts('07:55'), items: [{ id: 'a1i1', name: 'Samsung Galaxy S25', quantity: 1, price: 1299.00, barcode: '8806095012345' }] }],
    total: 1299.00, createdAt: ts('07:00'), lat: 25.2028, lng: 55.2406,
    pickedUp: true, pickedUpAt: ts('07:56'), pickupPartial: false,
  },
  {
    id: 'a2', orderNumber: 'ORD-2026-012', clientName: 'Elena Petrova', clientPhone: '+971 55 201 4404',
    clientAddress: 'Address Residences, Downtown Dubai', status: 'In Transit',
    courier: 'Maria Garcia', courierId: 'c2',
    deliveryDate: TODAY, deliveryTime: '09:00-11:00', paymentMethod: 'Card',
    items: [{ id: 'a2i1', name: 'Dyson V15 Vacuum Cleaner', quantity: 1, price: 2200.00, barcode: '5702016912345' }],
    packages: [{ id: 'a2p1', barcode: 'P-2013', status: 'picked', pickedAt: ts('08:05'), items: [{ id: 'a2i1', name: 'Dyson V15 Vacuum Cleaner', quantity: 1, price: 2200.00, barcode: '5702016912345' }] }],
    total: 2200.00, createdAt: ts('07:10'), lat: 25.1972, lng: 55.2744,
    pickedUp: true, pickedUpAt: ts('08:06'), pickupPartial: false,
  },

  // ── HISTORY: Delivered & Cancelled ───────────────────────────────────────
  {
    id: 'h1', orderNumber: 'ORD-2026-013', clientName: 'Ahmed Al Rashidi', clientPhone: '+971 55 201 4401',
    clientAddress: 'Tower A, Marina Walk, Dubai Marina', status: 'Delivered',
    courier: 'Alex Johnson', courierId: 'c1',
    deliveryDate: '2026-06-01', paymentMethod: 'Cash',
    items: [{ id: 'h1i1', name: 'BOSCH Cordless Drill Set', quantity: 1, price: 450.00, barcode: '4054628001234' }],
    packages: [{ id: 'h1p1', barcode: 'P-1901', status: 'picked', pickedAt: '2026-06-01T08:30:00Z', items: [{ id: 'h1i1', name: 'BOSCH Cordless Drill Set', quantity: 1, price: 450.00, barcode: '4054628001234' }] }],
    total: 450.00, createdAt: '2026-06-01T07:00:00Z', lat: 25.0794, lng: 55.1332,
    pickedUp: true, pickedUpAt: '2026-06-01T08:31:00Z', signature: 'data:signed',
    deliveredAt: '2026-06-01T10:15:00Z',
  },
  {
    id: 'h2', orderNumber: 'ORD-2026-014', clientName: 'Mohammed Al Farsi', clientPhone: '+971 55 201 4405',
    clientAddress: 'Bay Square Building 3, Business Bay', status: 'Delivered',
    courier: 'James Wilson', courierId: 'c3',
    deliveryDate: '2026-06-01', paymentMethod: 'Online',
    items: [{ id: 'h2i1', name: 'Instant Pot Duo 7-in-1', quantity: 1, price: 490.00, barcode: '6931706980349' }],
    packages: [{ id: 'h2p1', barcode: 'P-1902', status: 'picked', pickedAt: '2026-06-01T09:00:00Z', items: [{ id: 'h2i1', name: 'Instant Pot Duo 7-in-1', quantity: 1, price: 490.00, barcode: '6931706980349' }] }],
    total: 490.00, createdAt: '2026-06-01T08:00:00Z', lat: 25.1872, lng: 55.2741,
    pickedUp: true, pickedUpAt: '2026-06-01T09:01:00Z', signature: 'data:signed',
    deliveredAt: '2026-06-01T11:45:00Z',
  },
  {
    id: 'h3', orderNumber: 'ORD-2026-015', clientName: 'Omar Hassan', clientPhone: '+971 55 201 4407',
    clientAddress: 'Al Rigga Street, Shop 12, Deira', status: 'Cancelled',
    deliveryDate: '2026-06-01', paymentMethod: 'Card',
    items: [{ id: 'h3i1', name: 'Nike Air Max Running Shoes', quantity: 1, price: 380.00, barcode: '0194501234567' }],
    packages: [{ id: 'h3p1', barcode: 'P-1903', status: 'pending', items: [{ id: 'h3i1', name: 'Nike Air Max Running Shoes', quantity: 1, price: 380.00, barcode: '0194501234567' }] }],
    total: 380.00, comment: 'Customer requested cancellation', createdAt: '2026-06-01T10:00:00Z', lat: 25.2697, lng: 55.3120,
  },
];
// Depot / warehouse — Al Garhoud area near Dubai Airport
export const DEPOT_POSITION = { x: 55, y: 35 };
export const DEPOT_LATLNG: [number, number] = [25.2417, 55.3512];

export const sampleDeliveryRuns: DeliveryRun[] = [
  {
    id: 'run-active',
    runNumber: 'RUN-2026-A01',
    driverId: 'c2',
    driverName: 'Maria Garcia',
    vehiclePlate: 'DXB-B-22187',
    vehicleModel: 'Mitsubishi Canter',
    date: TODAY,
    status: 'In Progress',
    createdAt: ts('07:00'),
    estimatedDuration: '3h 30m',
    stops: [
      { stopNumber: 1, orderId: 'a1', clientName: 'Carlos Rivera',  clientAddress: 'Villa 8, Street 12B, Jumeirah 3', estimatedArrival: '09:00', status: 'completed', deliveredAt: ts('09:12'), x: 30, y: 60 },
      { stopNumber: 2, orderId: 'a2', clientName: 'Elena Petrova',  clientAddress: 'Address Residences, Downtown',   estimatedArrival: '10:00', status: 'pending',   x: 50, y: 62 },
    ],
  },
];
