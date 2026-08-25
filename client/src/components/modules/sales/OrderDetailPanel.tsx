import { useState } from 'react';
import { useModuleApi } from '../../../hooks/useModuleApi';
import { useEventBus } from '../../../hooks/useEventBus';
import { StatusBadge } from '../../shared/StatusBadge';
import { moduleRegistry } from '../../../core/module-registry';
import { eventBus } from '../../../core/event-bus';
import type { Order, OrderWithItems, OrderStatus } from '../../../stores/modules/sales.store';

interface Invoice {
  invoiceNumber: string;
  invoiceType: 'proforma' | 'final';
}

// The forward path through an order's lifecycle; cancellation is offered separately.
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  draft: 'confirmed',
  confirmed: 'shipped',
  shipped: 'completed',
};

/** 2x2 panel: full order view — line items, status progression, invoice generation. */
export function OrderDetailPanel() {
  const ordersApi = useModuleApi('sales/orders');
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);

  useEventBus<{ orderId: number }>('sales.order-selected', ({ orderId }) => {
    void ordersApi.get<OrderWithItems>(orderId).then(setOrder);
    setLastInvoice(null);
  });

  async function changeStatus(status: OrderStatus): Promise<void> {
    if (!order) return;
    setIsBusy(true);
    try {
      const updated = await ordersApi.action<Order>(order.id, 'status', 'PATCH', { status });
      setOrder({ ...updated, items: order.items });
      eventBus.emit('sales.status-changed', { orderId: order.id, newStatus: status });
    } finally {
      setIsBusy(false);
    }
  }

  async function generateInvoice(invoiceType: Invoice['invoiceType']): Promise<void> {
    if (!order) return;
    setIsBusy(true);
    try {
      const invoice = await ordersApi.action<Invoice>(order.id, 'invoice', 'POST', { invoiceType });
      setLastInvoice(invoice);
    } finally {
      setIsBusy(false);
    }
  }

  if (!order) {
    return <p className="p-4 text-sm text-slate-500">Select an order to see its details.</p>;
  }

  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{order.orderNumber}</h3>
          <p className="text-xs text-slate-500">{order.customerName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-left uppercase tracking-wider text-slate-500">
            <th className="py-1">Product</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-right">Unit</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="py-1">{item.productName}</td>
              <td className="py-1 text-right tabular-nums">{item.quantity}</td>
              <td className="py-1 text-right tabular-nums">{item.unitPrice.toFixed(2)}</td>
              <td className="py-1 text-right tabular-nums">{item.totalPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-right text-sm font-semibold tabular-nums">Total: {order.totalAmount.toFixed(2)}</p>

      <div className="flex flex-wrap gap-2">
        {nextStatus ? (
          <button
            onClick={() => void changeStatus(nextStatus)}
            disabled={isBusy}
            className="rounded bg-blue-600 px-3 py-1 text-xs text-white disabled:opacity-50"
          >
            Mark as {nextStatus}
          </button>
        ) : null}
        {order.status !== 'cancelled' && order.status !== 'completed' ? (
          <button
            onClick={() => void changeStatus('cancelled')}
            disabled={isBusy}
            className="rounded border border-red-300 px-3 py-1 text-xs text-red-600 disabled:opacity-50"
          >
            Cancel order
          </button>
        ) : null}
        <button
          onClick={() => void generateInvoice('proforma')}
          disabled={isBusy}
          className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:opacity-50"
        >
          Generate proforma
        </button>
        <button
          onClick={() => void generateInvoice('final')}
          disabled={isBusy}
          className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:opacity-50"
        >
          Generate invoice
        </button>
      </div>

      {lastInvoice ? (
        <p className="text-xs text-green-700">
          Issued {lastInvoice.invoiceType} invoice {lastInvoice.invoiceNumber}
        </p>
      ) : null}
    </div>
  );
}

moduleRegistry.registerPanelComponent('OrderDetailPanel', OrderDetailPanel);
