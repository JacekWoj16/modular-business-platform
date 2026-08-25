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
  customerName: string; // joined from customers, for display without a second fetch
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

export interface ListOrdersParams {
  status?: OrderStatus;
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ListOrdersResult {
  rows: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Invoice {
  id: number;
  orderId: number;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  issuedAt: string;
  pdfPath: string | null;
}
