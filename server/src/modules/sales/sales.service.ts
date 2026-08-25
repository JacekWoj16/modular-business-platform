import { HttpError } from '../../middleware/error.middleware';
import * as salesRepository from './sales.repository';
import type {
  Order,
  OrderWithItems,
  OrderStatus,
  CreateOrderInput,
  ListOrdersParams,
  ListOrdersResult,
  Invoice,
  InvoiceType,
} from './sales.types';

const VALID_STATUSES: OrderStatus[] = ['draft', 'confirmed', 'shipped', 'completed', 'cancelled'];
const VALID_INVOICE_TYPES: InvoiceType[] = ['proforma', 'final'];

export async function listOrders(params: ListOrdersParams): Promise<ListOrdersResult> {
  return salesRepository.findOrders(params);
}

export async function getOrder(id: number): Promise<OrderWithItems> {
  const order = await salesRepository.findOrderWithItems(id);
  if (!order) {
    throw new HttpError(404, `Order ${id} not found`);
  }
  return order;
}

export async function createOrder(
  input: CreateOrderInput,
  createdBy: number | null,
): Promise<OrderWithItems> {
  if (!input.customerId) {
    throw new HttpError(400, 'customerId is required');
  }
  if (!input.items || input.items.length === 0) {
    throw new HttpError(400, 'An order needs at least one line item');
  }
  for (const item of input.items) {
    if (!item.productName || item.productName.trim().length === 0) {
      throw new HttpError(400, 'Each line item needs a product name');
    }
    if (!(item.quantity > 0)) {
      throw new HttpError(400, `Quantity for "${item.productName}" must be greater than 0`);
    }
    if (item.unitPrice < 0) {
      throw new HttpError(400, `Unit price for "${item.productName}" cannot be negative`);
    }
  }
  const customerFound = await salesRepository.customerExists(input.customerId);
  if (!customerFound) {
    throw new HttpError(404, `Customer ${input.customerId} not found`);
  }
  return salesRepository.insertOrderWithItems(input, createdBy);
}

export async function changeOrderStatus(id: number, status: string): Promise<Order> {
  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    throw new HttpError(400, `Invalid status "${status}"`);
  }
  const updated = await salesRepository.updateOrderStatus(id, status as OrderStatus);
  if (!updated) {
    throw new HttpError(404, `Order ${id} not found`);
  }
  return updated;
}

export async function generateInvoice(id: number, invoiceType: string): Promise<Invoice> {
  if (!VALID_INVOICE_TYPES.includes(invoiceType as InvoiceType)) {
    throw new HttpError(400, `Invalid invoice type "${invoiceType}"`);
  }
  const exists = await salesRepository.orderExists(id);
  if (!exists) {
    throw new HttpError(404, `Order ${id} not found`);
  }
  return salesRepository.insertInvoice(id, invoiceType as InvoiceType);
}
