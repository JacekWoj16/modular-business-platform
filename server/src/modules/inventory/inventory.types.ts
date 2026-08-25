export type ProductUnit = 'pcs' | 'kg' | 'm' | 'l' | 'set';
export type MovementType = 'in' | 'out' | 'adjustment';

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: ProductUnit;
  currentStock: number;
  minStockLevel: number;
  price: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  movementType: MovementType;
  quantity: number;
  reference: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
}

export interface ProductWithMovements extends Product {
  recentMovements: StockMovement[];
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit?: ProductUnit;
  currentStock?: number;
  minStockLevel?: number;
  price?: number;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ListProductsParams {
  search?: string;
  lowStockOnly?: boolean;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListProductsResult {
  rows: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateMovementInput {
  movementType: MovementType;
  quantity: number;
  reference?: string;
  notes?: string;
}

export interface MovementResult {
  movement: StockMovement;
  product: Product;
}
