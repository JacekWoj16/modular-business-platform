import { HttpError } from '../../middleware/error.middleware';
import * as inventoryRepository from './inventory.repository';
import type {
  Product,
  ProductWithMovements,
  CreateProductInput,
  UpdateProductInput,
  ListProductsParams,
  ListProductsResult,
  CreateMovementInput,
  MovementResult,
} from './inventory.types';

const VALID_UNITS = ['pcs', 'kg', 'm', 'l', 'set'];
const VALID_MOVEMENT_TYPES = ['in', 'out', 'adjustment'];

export async function listProducts(params: ListProductsParams): Promise<ListProductsResult> {
  return inventoryRepository.findProducts(params);
}

export async function getProduct(id: number): Promise<ProductWithMovements> {
  const product = await inventoryRepository.findProductWithMovements(id);
  if (!product) {
    throw new HttpError(404, `Product ${id} not found`);
  }
  return product;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  if (!input.sku || input.sku.trim().length === 0) {
    throw new HttpError(400, 'SKU is required');
  }
  if (!input.name || input.name.trim().length === 0) {
    throw new HttpError(400, 'Product name is required');
  }
  if (input.unit && !VALID_UNITS.includes(input.unit)) {
    throw new HttpError(400, `Invalid unit "${input.unit}"`);
  }
  if (input.price !== undefined && input.price < 0) {
    throw new HttpError(400, 'Price cannot be negative');
  }
  if (await inventoryRepository.skuExists(input.sku)) {
    throw new HttpError(400, `SKU "${input.sku}" is already in use`);
  }
  return inventoryRepository.insertProduct(input);
}

export async function updateProduct(id: number, input: UpdateProductInput): Promise<Product> {
  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new HttpError(400, 'Product name cannot be empty');
  }
  if (input.unit && !VALID_UNITS.includes(input.unit)) {
    throw new HttpError(400, `Invalid unit "${input.unit}"`);
  }
  if (input.price !== undefined && input.price < 0) {
    throw new HttpError(400, 'Price cannot be negative');
  }
  const updated = await inventoryRepository.updateProductById(id, input);
  if (!updated) {
    throw new HttpError(404, `Product ${id} not found`);
  }
  return updated;
}

export async function recordMovement(
  productId: number,
  input: CreateMovementInput,
  createdBy: number | null,
): Promise<MovementResult> {
  if (!VALID_MOVEMENT_TYPES.includes(input.movementType)) {
    throw new HttpError(400, `Invalid movement type "${input.movementType}"`);
  }
  if (input.movementType === 'adjustment') {
    if (!input.quantity) {
      throw new HttpError(400, 'Adjustment quantity must be nonzero');
    }
  } else if (!(input.quantity > 0)) {
    throw new HttpError(400, 'Quantity must be greater than 0');
  }

  const result = await inventoryRepository.applyStockMovement(productId, input, createdBy);
  if (result === 'not_found') {
    throw new HttpError(404, `Product ${productId} not found`);
  }
  if (result === 'insufficient_stock') {
    throw new HttpError(400, 'Movement would take stock below zero');
  }
  return result;
}
