import { pool, query } from '../../database';
import type {
  Product,
  StockMovement,
  ProductWithMovements,
  CreateProductInput,
  UpdateProductInput,
  ListProductsParams,
  ListProductsResult,
  CreateMovementInput,
  MovementResult,
} from './inventory.types';

interface ProductRow {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: Product['unit'];
  current_stock: string;
  min_stock_level: string;
  price: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface StockMovementRow {
  id: number;
  product_id: number;
  movement_type: StockMovement['movementType'];
  quantity: string;
  reference: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: Date;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    category: row.category,
    unit: row.unit,
    currentStock: Number(row.current_stock),
    minStockLevel: Number(row.min_stock_level),
    price: row.price !== null ? Number(row.price) : null,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toMovement(row: StockMovementRow): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    movementType: row.movement_type,
    quantity: Number(row.quantity),
    reference: row.reference,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findProducts(params: ListProductsParams): Promise<ListProductsResult> {
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
    conditions.push(`(name ILIKE $${values.length} OR sku ILIKE $${values.length})`);
  }
  if (params.lowStockOnly) {
    conditions.push('current_stock < min_stock_level');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query<ProductRow>(
    `SELECT * FROM products ${whereClause} ORDER BY name LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, offset],
  );

  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM products ${whereClause}`,
    values,
  );

  return { rows: rows.map(toProduct), total: Number(countRows[0]?.count ?? 0), page, pageSize };
}

export async function findProductWithMovements(id: number): Promise<ProductWithMovements | null> {
  const rows = await query<ProductRow>('SELECT * FROM products WHERE id = $1', [id]);
  const row = rows[0];
  if (!row) return null;

  const movementRows = await query<StockMovementRow>(
    'SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC LIMIT 10',
    [id],
  );

  return { ...toProduct(row), recentMovements: movementRows.map(toMovement) };
}

export async function findProductById(id: number): Promise<Product | null> {
  const rows = await query<ProductRow>('SELECT * FROM products WHERE id = $1', [id]);
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function skuExists(sku: string): Promise<boolean> {
  const rows = await query<{ id: number }>('SELECT id FROM products WHERE sku = $1', [sku]);
  return rows.length > 0;
}

export async function insertProduct(input: CreateProductInput): Promise<Product> {
  const rows = await query<ProductRow>(
    `INSERT INTO products (sku, name, description, category, unit, current_stock, min_stock_level, price)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.sku,
      input.name,
      input.description ?? null,
      input.category ?? null,
      input.unit ?? 'pcs',
      input.currentStock ?? 0,
      input.minStockLevel ?? 0,
      input.price ?? null,
    ],
  );
  return toProduct(rows[0]!);
}

export async function updateProductById(id: number, input: UpdateProductInput): Promise<Product | null> {
  const fieldMap: Record<string, unknown> = {
    sku: input.sku,
    name: input.name,
    description: input.description,
    category: input.category,
    unit: input.unit,
    current_stock: input.currentStock,
    min_stock_level: input.minStockLevel,
    price: input.price,
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
    return findProductById(id);
  }

  values.push(id);
  const rows = await query<ProductRow>(
    `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values,
  );
  return rows[0] ? toProduct(rows[0]) : null;
}

/** Signed stock delta for a movement: in adds, out subtracts, adjustment is already signed. */
function signedDelta(movementType: CreateMovementInput['movementType'], quantity: number): number {
  if (movementType === 'in') return quantity;
  if (movementType === 'out') return -quantity;
  return quantity; // adjustment: caller passes the signed delta directly
}

/**
 * Records a stock movement and applies its effect to the product's
 * current_stock in the same transaction, row-locked so two concurrent
 * movements on the same product can't race each other into a negative or
 * inconsistent stock level.
 */
export async function applyStockMovement(
  productId: number,
  input: CreateMovementInput,
  createdBy: number | null,
): Promise<MovementResult | 'not_found' | 'insufficient_stock'> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: productRows } = await client.query<ProductRow>(
      'SELECT * FROM products WHERE id = $1 FOR UPDATE',
      [productId],
    );
    const productRow = productRows[0];
    if (!productRow) {
      await client.query('ROLLBACK');
      return 'not_found';
    }

    const delta = signedDelta(input.movementType, input.quantity);
    const newStock = Number(productRow.current_stock) + delta;
    if (newStock < 0) {
      await client.query('ROLLBACK');
      return 'insufficient_stock';
    }

    const { rows: updatedRows } = await client.query<ProductRow>(
      'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newStock, productId],
    );

    const { rows: movementRows } = await client.query<StockMovementRow>(
      `INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [productId, input.movementType, input.quantity, input.reference ?? null, input.notes ?? null, createdBy],
    );

    await client.query('COMMIT');
    return { movement: toMovement(movementRows[0]!), product: toProduct(updatedRows[0]!) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
