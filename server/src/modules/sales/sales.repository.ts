import { pool, query } from '../../database';
import type {
  Order,
  OrderItem,
  OrderWithItems,
  OrderStatus,
  CreateOrderInput,
  ListOrdersParams,
  ListOrdersResult,
  Invoice,
  InvoiceType,
} from './sales.types';

/** Raw `orders` row joined with the customer's name (pg returns NUMERIC as string). */
interface OrderRow {
  id: number;
  customer_id: number;
  customer_name: string;
  order_number: string;
  status: OrderStatus;
  total_amount: string;
  tax_amount: string;
  notes: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

interface OrderItemRow {
  id: number;
  order_id: number;
  product_name: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  sort_order: number;
}

interface InvoiceRow {
  id: number;
  order_id: number;
  invoice_number: string;
  invoice_type: InvoiceType;
  issued_at: Date;
  pdf_path: string | null;
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    orderNumber: row.order_number,
    status: row.status,
    totalAmount: Number(row.total_amount),
    taxAmount: Number(row.tax_amount),
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productName: row.product_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    sortOrder: row.sort_order,
  };
}

function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    orderId: row.order_id,
    invoiceNumber: row.invoice_number,
    invoiceType: row.invoice_type,
    issuedAt: row.issued_at.toISOString(),
    pdfPath: row.pdf_path,
  };
}

const ORDER_SELECT = `
  SELECT o.*, c.name AS customer_name
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
`;

export async function findOrders(params: ListOrdersParams): Promise<ListOrdersResult> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 25;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.status) {
    values.push(params.status);
    conditions.push(`o.status = $${values.length}`);
  }
  if (params.customerId) {
    values.push(params.customerId);
    conditions.push(`o.customer_id = $${values.length}`);
  }
  if (params.dateFrom) {
    values.push(params.dateFrom);
    conditions.push(`o.created_at >= $${values.length}`);
  }
  if (params.dateTo) {
    values.push(params.dateTo);
    conditions.push(`o.created_at <= $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query<OrderRow>(
    `${ORDER_SELECT} ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, offset],
  );

  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM orders o ${whereClause}`,
    values,
  );

  return { rows: rows.map(toOrder), total: Number(countRows[0]?.count ?? 0), page, pageSize };
}

export async function findOrderWithItems(id: number): Promise<OrderWithItems | null> {
  const orderRows = await query<OrderRow>(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
  const orderRow = orderRows[0];
  if (!orderRow) return null;

  const itemRows = await query<OrderItemRow>(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY sort_order',
    [id],
  );

  return { ...toOrder(orderRow), items: itemRows.map(toOrderItem) };
}

/**
 * Creates an order with its line items in one transaction, and generates a
 * yearly-sequential order number (ORD-2026-00001). An advisory lock
 * serializes number generation so two concurrent requests can't land on the
 * same next number.
 */
export async function insertOrderWithItems(
  input: CreateOrderInput,
  createdBy: number | null,
): Promise<OrderWithItems> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('orders.order_number'))");

    const year = new Date().getFullYear();
    const { rows: countRows } = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM orders WHERE order_number LIKE $1',
      [`ORD-${year}-%`],
    );
    const nextSeq = Number(countRows[0]?.count ?? 0) + 1;
    const orderNumber = `ORD-${year}-${String(nextSeq).padStart(5, '0')}`;

    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalAmount = Math.round(subtotal * 100) / 100;

    const { rows: orderRows } = await client.query<OrderRow>(
      `INSERT INTO orders (customer_id, order_number, status, total_amount, tax_amount, notes, created_by)
       VALUES ($1, $2, 'draft', $3, 0, $4, $5)
       RETURNING *, (SELECT name FROM customers WHERE id = $1) AS customer_name`,
      [input.customerId, orderNumber, totalAmount, input.notes ?? null, createdBy],
    );
    const orderRow = orderRows[0]!;

    const itemRows: OrderItemRow[] = [];
    for (const [index, item] of input.items.entries()) {
      const totalPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
      const { rows } = await client.query<OrderItemRow>(
        `INSERT INTO order_items (order_id, product_name, quantity, unit_price, total_price, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [orderRow.id, item.productName, item.quantity, item.unitPrice, totalPrice, index],
      );
      itemRows.push(rows[0]!);
    }

    await client.query('COMMIT');
    return { ...toOrder(orderRow), items: itemRows.map(toOrderItem) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order | null> {
  const rows = await query<OrderRow>(
    `UPDATE orders o SET status = $1, updated_at = NOW()
     WHERE o.id = $2
     RETURNING o.*, (SELECT name FROM customers WHERE id = o.customer_id) AS customer_name`,
    [status, id],
  );
  return rows[0] ? toOrder(rows[0]) : null;
}

export async function orderExists(id: number): Promise<boolean> {
  const rows = await query<{ id: number }>('SELECT id FROM orders WHERE id = $1', [id]);
  return rows.length > 0;
}

// Sales depends on Customers (see sales.module.ts), so it's allowed to read
// the customers table directly — this checks the FK target exists up front
// so a bad customerId surfaces as a 404, not a raw constraint-violation 500.
export async function customerExists(customerId: number): Promise<boolean> {
  const rows = await query<{ id: number }>('SELECT id FROM customers WHERE id = $1', [customerId]);
  return rows.length > 0;
}

/** Generates a yearly-sequential invoice number (PRO-2026-00001 / INV-2026-00001). */
export async function insertInvoice(orderId: number, invoiceType: InvoiceType): Promise<Invoice> {
  const year = new Date().getFullYear();
  const prefix = invoiceType === 'proforma' ? 'PRO' : 'INV';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('invoices.invoice_number'))");

    const { rows: countRows } = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM invoices WHERE invoice_number LIKE $1',
      [`${prefix}-${year}-%`],
    );
    const nextSeq = Number(countRows[0]?.count ?? 0) + 1;
    const invoiceNumber = `${prefix}-${year}-${String(nextSeq).padStart(5, '0')}`;

    const { rows } = await client.query<InvoiceRow>(
      `INSERT INTO invoices (order_id, invoice_number, invoice_type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [orderId, invoiceNumber, invoiceType],
    );

    await client.query('COMMIT');
    return toInvoice(rows[0]!);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
