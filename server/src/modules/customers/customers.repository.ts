import { query } from '../../database';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersParams,
  ListCustomersResult,
} from './customers.types';

/** Shape of a raw `customers` row as PostgreSQL returns it (snake_case). */
interface CustomerRow {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  tax_id: string | null;
  customer_type: Customer['customerType'];
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    postalCode: row.postal_code,
    taxId: row.tax_id,
    customerType: row.customer_type,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findCustomers(params: ListCustomersParams): Promise<ListCustomersResult> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 25;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (!params.includeInactive) {
    conditions.push('is_active = true');
  }
  if (params.search) {
    values.push(`%${params.search}%`);
    conditions.push(
      `(name ILIKE $${values.length} OR email ILIKE $${values.length} OR tax_id ILIKE $${values.length})`,
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query<CustomerRow>(
    `SELECT * FROM customers ${whereClause} ORDER BY name LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, offset],
  );

  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM customers ${whereClause}`,
    values,
  );

  return { rows: rows.map(toCustomer), total: Number(countRows[0]?.count ?? 0), page, pageSize };
}

export async function findCustomerById(id: number): Promise<Customer | null> {
  const rows = await query<CustomerRow>('SELECT * FROM customers WHERE id = $1', [id]);
  return rows[0] ? toCustomer(rows[0]) : null;
}

export async function insertCustomer(input: CreateCustomerInput): Promise<Customer> {
  const rows = await query<CustomerRow>(
    `INSERT INTO customers
       (name, email, phone, address_line1, address_line2, city, postal_code, tax_id, customer_type, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      input.name,
      input.email ?? null,
      input.phone ?? null,
      input.addressLine1 ?? null,
      input.addressLine2 ?? null,
      input.city ?? null,
      input.postalCode ?? null,
      input.taxId ?? null,
      input.customerType ?? 'individual',
      input.notes ?? null,
    ],
  );
  return toCustomer(rows[0]!);
}

export async function updateCustomerById(
  id: number,
  input: UpdateCustomerInput,
): Promise<Customer | null> {
  const fieldMap: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    address_line1: input.addressLine1,
    address_line2: input.addressLine2,
    city: input.city,
    postal_code: input.postalCode,
    tax_id: input.taxId,
    customer_type: input.customerType,
    notes: input.notes,
  };

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [column, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    }
  }

  if (fields.length === 0) {
    return findCustomerById(id);
  }

  values.push(id);
  const rows = await query<CustomerRow>(
    `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values,
  );
  return rows[0] ? toCustomer(rows[0]) : null;
}

export async function softDeleteCustomerById(id: number): Promise<boolean> {
  const rows = await query<{ id: number }>(
    'UPDATE customers SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
    [id],
  );
  return rows.length > 0;
}
