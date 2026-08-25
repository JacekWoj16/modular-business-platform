import { create } from 'zustand';

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

interface InventoryState {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
}));
