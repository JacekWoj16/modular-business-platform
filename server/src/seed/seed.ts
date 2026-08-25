import bcrypt from 'bcryptjs';
import { pool, query } from '../database';
import { registerAllModules } from '../modules/register-all';
import { moduleRegistry } from '../modules/registry';
import * as customersService from '../modules/customers/customers.service';
import * as salesService from '../modules/sales/sales.service';
import * as inventoryService from '../modules/inventory/inventory.service';
import * as layoutService from '../layout/layout.service';
import type { OrderStatus } from '../modules/sales/sales.types';
import type { ProductUnit, MovementType } from '../modules/inventory/inventory.types';

const DEMO_PASSWORD = 'demo1234';

interface SeedUser {
  username: string;
  fullName: string;
  role: string;
  modules: string[];
}

// admin sees everything; sales_rep and warehouse each get a different pair
// of modules, so logging in as different users visibly changes the app —
// that's the whole point of the per-user module toggle demo.
const USERS: SeedUser[] = [
  { username: 'admin', fullName: 'Admin User', role: 'admin', modules: ['customers', 'sales', 'inventory'] },
  { username: 'sales_rep', fullName: 'Anna Sprzedaż', role: 'user', modules: ['customers', 'sales'] },
  { username: 'warehouse', fullName: 'Marek Magazyn', role: 'user', modules: ['customers', 'inventory'] },
];

interface SeedCustomer {
  name: string;
  customerType: 'individual' | 'business';
  city: string;
  email?: string;
  taxId?: string;
  inactive?: boolean;
}

const CUSTOMERS: SeedCustomer[] = [
  { name: 'Kowalski Sp. z o.o.', customerType: 'business', city: 'Kraków', email: 'biuro@kowalski.pl', taxId: '6751112233' },
  { name: 'Anna Nowak', customerType: 'individual', city: 'Warszawa', email: 'anna.nowak@example.com' },
  { name: 'Piotr Wiśniewski', customerType: 'individual', city: 'Poznań' },
  { name: 'Zielony Dom Sp. z o.o.', customerType: 'business', city: 'Wrocław', taxId: '8992223344' },
  { name: 'Katarzyna Wójcik', customerType: 'individual', city: 'Gdańsk' },
  { name: 'Marek Kowalczyk', customerType: 'individual', city: 'Łódź' },
  { name: 'BudMax S.A.', customerType: 'business', city: 'Katowice', taxId: '6342556677' },
  { name: 'Magdalena Lewandowska', customerType: 'individual', city: 'Szczecin' },
  { name: 'Tomasz Zieliński', customerType: 'individual', city: 'Lublin' },
  { name: 'Agnieszka Szymańska', customerType: 'individual', city: 'Bydgoszcz' },
  { name: 'TechFlow Sp. z o.o.', customerType: 'business', city: 'Warszawa', taxId: '5213344556' },
  { name: 'Krzysztof Woźniak', customerType: 'individual', city: 'Kraków' },
  { name: 'Ewa Dąbrowska', customerType: 'individual', city: 'Poznań' },
  { name: 'Stary Młyn s.c.', customerType: 'business', city: 'Wrocław', taxId: '9001122334', inactive: true },
  { name: 'Paweł Kaczmarek', customerType: 'individual', city: 'Gdańsk', inactive: true },
];

interface SeedProduct {
  sku: string;
  name: string;
  category: string;
  unit: ProductUnit;
  currentStock: number;
  minStockLevel: number;
  price: number;
  /** Initial delivery movement — kept small for the deliberately low-stock products. */
  deliveryQty: number;
  /** A second movement, for realism / a longer movement history. Both quantities are
   * pre-checked against the running stock so seeding never hits the insufficient-stock guard. */
  secondMovement?: { type: MovementType; quantity: number };
}

// 4 of these (ELE-005, OFF-006, RAW-003, RAW-005) stay below min_stock_level
// even after their delivery, to populate the Stock Alerts panel on first login.
const PRODUCTS: SeedProduct[] = [
  { sku: 'ELE-001', name: 'Wireless Mouse', category: 'Electronics', unit: 'pcs', currentStock: 120, minStockLevel: 20, price: 49.9, deliveryQty: 30, secondMovement: { type: 'out', quantity: 10 } },
  { sku: 'ELE-002', name: 'USB-C Cable 1m', category: 'Electronics', unit: 'pcs', currentStock: 200, minStockLevel: 30, price: 19.9, deliveryQty: 50, secondMovement: { type: 'out', quantity: 15 } },
  { sku: 'ELE-003', name: '27" Monitor', category: 'Electronics', unit: 'pcs', currentStock: 15, minStockLevel: 5, price: 899, deliveryQty: 5, secondMovement: { type: 'adjustment', quantity: -2 } },
  { sku: 'ELE-004', name: 'Mechanical Keyboard', category: 'Electronics', unit: 'pcs', currentStock: 40, minStockLevel: 10, price: 249, deliveryQty: 10, secondMovement: { type: 'out', quantity: 5 } },
  { sku: 'ELE-005', name: 'Webcam HD', category: 'Electronics', unit: 'pcs', currentStock: 3, minStockLevel: 15, price: 129, deliveryQty: 1 },
  { sku: 'ELE-006', name: 'Laptop Stand', category: 'Electronics', unit: 'pcs', currentStock: 60, minStockLevel: 15, price: 89, deliveryQty: 15, secondMovement: { type: 'adjustment', quantity: -3 } },
  { sku: 'ELE-007', name: 'Power Bank 10000mAh', category: 'Electronics', unit: 'pcs', currentStock: 80, minStockLevel: 20, price: 69, deliveryQty: 20 },
  { sku: 'OFF-001', name: 'A4 Paper Ream', category: 'Office Supplies', unit: 'pcs', currentStock: 300, minStockLevel: 50, price: 14.9, deliveryQty: 50, secondMovement: { type: 'out', quantity: 20 } },
  { sku: 'OFF-002', name: 'Ballpoint Pen (box of 50)', category: 'Office Supplies', unit: 'pcs', currentStock: 90, minStockLevel: 20, price: 24.9, deliveryQty: 20, secondMovement: { type: 'out', quantity: 10 } },
  { sku: 'OFF-003', name: 'Stapler', category: 'Office Supplies', unit: 'pcs', currentStock: 40, minStockLevel: 10, price: 12.5, deliveryQty: 10 },
  { sku: 'OFF-004', name: 'Sticky Notes Pack', category: 'Office Supplies', unit: 'pcs', currentStock: 150, minStockLevel: 30, price: 8.9, deliveryQty: 30, secondMovement: { type: 'adjustment', quantity: -5 } },
  { sku: 'OFF-005', name: 'Desk Organizer', category: 'Office Supplies', unit: 'pcs', currentStock: 25, minStockLevel: 10, price: 34.9, deliveryQty: 5 },
  { sku: 'OFF-006', name: 'Whiteboard Marker Set', category: 'Office Supplies', unit: 'pcs', currentStock: 4, minStockLevel: 20, price: 19.9, deliveryQty: 2 },
  { sku: 'OFF-007', name: 'Binder Clips (box)', category: 'Office Supplies', unit: 'pcs', currentStock: 200, minStockLevel: 40, price: 6.9, deliveryQty: 40 },
  { sku: 'RAW-001', name: 'Steel Sheet 1mm', category: 'Raw Materials', unit: 'm', currentStock: 500, minStockLevel: 100, price: 45, deliveryQty: 100, secondMovement: { type: 'out', quantity: 50 } },
  { sku: 'RAW-002', name: 'Aluminum Rod', category: 'Raw Materials', unit: 'm', currentStock: 350, minStockLevel: 80, price: 22, deliveryQty: 70, secondMovement: { type: 'out', quantity: 30 } },
  { sku: 'RAW-003', name: 'PVC Pipe 20mm', category: 'Raw Materials', unit: 'm', currentStock: 6, minStockLevel: 50, price: 8.5, deliveryQty: 3 },
  { sku: 'RAW-004', name: 'Copper Wire', category: 'Raw Materials', unit: 'kg', currentStock: 220, minStockLevel: 50, price: 38, deliveryQty: 40 },
  { sku: 'RAW-005', name: 'Industrial Adhesive', category: 'Raw Materials', unit: 'l', currentStock: 2, minStockLevel: 10, price: 55, deliveryQty: 1 },
  { sku: 'RAW-006', name: 'Wood Plank Oak', category: 'Raw Materials', unit: 'm', currentStock: 180, minStockLevel: 40, price: 65, deliveryQty: 30 },
];

interface SeedOrder {
  customerIndex: number; // index into the CUSTOMERS array (active ones only)
  items: { productName: string; quantity: number; unitPrice: number }[];
  status: OrderStatus;
  backdate?: boolean; // pushes created_at back 2 days, to trigger the "pending > 24h" alert
}

// order_items are free-text (no FK to inventory.products) — Sales and
// Inventory don't share a table, only whatever an order taker typed in.
// That's the module boundary holding even at the schema level.
const ORDERS: SeedOrder[] = [
  { customerIndex: 0, status: 'draft', backdate: true, items: [{ productName: 'Setup Fee', quantity: 1, unitPrice: 500 }, { productName: 'Support Package', quantity: 2, unitPrice: 150 }, { productName: 'Extra Hours', quantity: 3, unitPrice: 80 }] },
  { customerIndex: 1, status: 'draft', backdate: true, items: [{ productName: 'Office Chair', quantity: 2, unitPrice: 350 }, { productName: 'Desk Lamp', quantity: 3, unitPrice: 60 }] },
  { customerIndex: 2, status: 'draft', items: [{ productName: 'Website Package', quantity: 1, unitPrice: 2500 }, { productName: 'Domain Registration', quantity: 1, unitPrice: 49 }, { productName: 'SEO Audit', quantity: 1, unitPrice: 300 }] },
  { customerIndex: 3, status: 'confirmed', items: [{ productName: 'Widget A', quantity: 10, unitPrice: 19.99 }, { productName: 'Widget B', quantity: 5, unitPrice: 49.5 }, { productName: 'Widget C', quantity: 2, unitPrice: 99 }] },
  { customerIndex: 4, status: 'confirmed', items: [{ productName: 'Training Session', quantity: 4, unitPrice: 200 }, { productName: 'Materials', quantity: 1, unitPrice: 150 }] },
  { customerIndex: 5, status: 'confirmed', items: [{ productName: 'Bulk Paper Order', quantity: 50, unitPrice: 14.9 }, { productName: 'Pen Boxes', quantity: 10, unitPrice: 24.9 }, { productName: 'Staplers', quantity: 5, unitPrice: 12.5 }] },
  { customerIndex: 6, status: 'shipped', items: [{ productName: 'Steel Sheets', quantity: 20, unitPrice: 45 }, { productName: 'Aluminum Rods', quantity: 15, unitPrice: 22 }, { productName: 'Copper Wire', quantity: 10, unitPrice: 38 }, { productName: 'Delivery Fee', quantity: 1, unitPrice: 150 }] },
  { customerIndex: 7, status: 'shipped', items: [{ productName: 'Laptop', quantity: 3, unitPrice: 3200 }, { productName: 'Monitor', quantity: 3, unitPrice: 899 }, { productName: 'Keyboard', quantity: 3, unitPrice: 249 }, { productName: 'Mouse', quantity: 3, unitPrice: 49.9 }, { productName: 'Cable', quantity: 3, unitPrice: 19.9 }] },
  { customerIndex: 8, status: 'completed', items: [{ productName: 'Maintenance Contract', quantity: 1, unitPrice: 1200 }, { productName: 'Emergency Callout', quantity: 2, unitPrice: 250 }] },
  { customerIndex: 9, status: 'completed', items: [{ productName: 'Custom Furniture', quantity: 2, unitPrice: 750 }, { productName: 'Installation', quantity: 1, unitPrice: 300 }, { productName: 'Delivery', quantity: 1, unitPrice: 100 }] },
  { customerIndex: 10, status: 'completed', items: [{ productName: 'Annual License', quantity: 1, unitPrice: 4999 }, { productName: 'Onboarding', quantity: 1, unitPrice: 500 }] },
  { customerIndex: 11, status: 'cancelled', items: [{ productName: 'Sample Order', quantity: 1, unitPrice: 99 }, { productName: 'Rush Fee', quantity: 1, unitPrice: 50 }] },
];

function enabledPanelIdsFor(moduleIds: string[]): string[] {
  const panelIds: string[] = [];
  for (const moduleId of moduleIds) {
    const moduleDef = moduleRegistry.get(moduleId);
    if (moduleDef) {
      panelIds.push(...moduleDef.panels.map((panel) => panel.id));
    }
  }
  return panelIds;
}

async function alreadySeeded(): Promise<boolean> {
  const rows = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
  return Number(rows[0]?.count ?? 0) > 0;
}

async function seed(): Promise<void> {
  if (await alreadySeeded()) {
    console.log('Users table is not empty — already seeded, skipping.');
    return;
  }

  registerAllModules();

  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const userIds = new Map<string, number>();
  for (const user of USERS) {
    const rows = await query<{ id: number }>(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.username, passwordHash, user.fullName, user.role],
    );
    userIds.set(user.username, rows[0]!.id);
    for (const moduleId of user.modules) {
      await query('INSERT INTO user_modules (user_id, module_id, enabled) VALUES ($1, $2, true)', [
        rows[0]!.id,
        moduleId,
      ]);
    }
  }

  console.log('Seeding customers...');
  const customerIds: number[] = [];
  for (const c of CUSTOMERS) {
    const customer = await customersService.createCustomer({
      name: c.name,
      customerType: c.customerType,
      city: c.city,
      email: c.email,
      taxId: c.taxId,
    });
    customerIds.push(customer.id);
    if (c.inactive) {
      await customersService.deleteCustomer(customer.id);
    }
  }

  console.log('Seeding products and stock movements...');
  let movementCount = 0;
  for (const p of PRODUCTS) {
    const product = await inventoryService.createProduct({
      sku: p.sku,
      name: p.name,
      category: p.category,
      unit: p.unit,
      currentStock: p.currentStock,
      minStockLevel: p.minStockLevel,
      price: p.price,
    });
    await inventoryService.recordMovement(
      product.id,
      { movementType: 'in', quantity: p.deliveryQty, reference: `PO-${p.sku}`, notes: 'Initial delivery' },
      null,
    );
    movementCount += 1;
    if (p.secondMovement) {
      await inventoryService.recordMovement(
        product.id,
        { movementType: p.secondMovement.type, quantity: p.secondMovement.quantity, notes: 'Routine stock update' },
        null,
      );
      movementCount += 1;
    }
  }

  console.log('Seeding orders...');
  const backdatedOrderIds: number[] = [];
  for (const o of ORDERS) {
    const order = await salesService.createOrder(
      { customerId: customerIds[o.customerIndex]!, items: o.items },
      null,
    );
    if (o.status !== 'draft') {
      await salesService.changeOrderStatus(order.id, o.status);
    }
    if (o.backdate) {
      backdatedOrderIds.push(order.id);
    }
  }
  if (backdatedOrderIds.length > 0) {
    await query(
      `UPDATE orders SET created_at = NOW() - INTERVAL '2 days', updated_at = NOW() - INTERVAL '2 days'
       WHERE id = ANY($1::int[])`,
      [backdatedOrderIds],
    );
  }

  console.log('Seeding default panel layouts...');
  for (const user of USERS) {
    const userId = userIds.get(user.username)!;
    const panelIds = enabledPanelIdsFor(user.modules);
    const layout = await layoutService.getLayout(userId, panelIds); // no saved rows yet -> all defaults
    await layoutService.saveLayout(userId, layout);
  }

  console.log('\nSeed complete:');
  console.log(`  ${USERS.length} users, ${CUSTOMERS.length} customers, ${PRODUCTS.length} products,`);
  console.log(`  ${movementCount} stock movements, ${ORDERS.length} orders.`);
  console.log('\nLogin with any of these (password for all: ' + DEMO_PASSWORD + '):');
  for (const user of USERS) {
    console.log(`  ${user.username} — ${user.fullName} — modules: ${user.modules.join(', ')}`);
  }
}

seed()
  .then(() => pool.end())
  .catch(async (error: unknown) => {
    console.error(error);
    await pool.end();
    process.exitCode = 1;
  });
