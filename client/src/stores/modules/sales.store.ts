import { create } from 'zustand';
import { eventBus } from '../../core/event-bus';

export type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
export type InvoiceType = 'proforma' | 'final';

export interface OrderItem {
  id: number;
  orderId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  taxAmount: number;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderItemInput {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  customerId: number;
  notes?: string;
  items: CreateOrderItemInput[];
}

interface SalesState {
  orders: Order[];
  selectedOrderId: number | null;
  setOrders: (orders: Order[]) => void;
  /** Sets the selection and emits `sales.order-selected` for OrderDetailPanel. */
  selectOrder: (id: number) => void;
}

export const useSalesStore = create<SalesState>((set) => ({
  orders: [],
  selectedOrderId: null,
  setOrders: (orders) => set({ orders }),
  selectOrder: (id) => {
    set({ selectedOrderId: id });
    eventBus.emit('sales.order-selected', { orderId: id });
  },
}));
