import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as salesService from './sales.service';
import type { OrderStatus } from './sales.types';

export const salesRouter = Router();

// GET /api/modules/sales/orders — list (filtered by status, customer, date range)
salesRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { status, customerId, dateFrom, dateTo, page, pageSize } = req.query;
    const result = await salesService.listOrders({
      status: typeof status === 'string' ? (status as OrderStatus) : undefined,
      customerId: customerId ? Number(customerId) : undefined,
      dateFrom: typeof dateFrom === 'string' ? dateFrom : undefined,
      dateTo: typeof dateTo === 'string' ? dateTo : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    res.json(result);
  }),
);

// GET /api/modules/sales/orders/:id — single with items
salesRouter.get(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const order = await salesService.getOrder(Number(req.params.id));
    res.json(order);
  }),
);

// POST /api/modules/sales/orders — create with items
salesRouter.post(
  '/orders',
  asyncHandler(async (req, res) => {
    // TODO: once auth middleware attaches req.user, pass its id as createdBy
    // instead of null.
    const order = await salesService.createOrder(req.body, null);
    res.status(201).json(order);
  }),
);

// PATCH /api/modules/sales/orders/:id/status — change status
salesRouter.patch(
  '/orders/:id/status',
  asyncHandler(async (req, res) => {
    const order = await salesService.changeOrderStatus(Number(req.params.id), req.body.status);
    res.json(order);
  }),
);

// POST /api/modules/sales/orders/:id/invoice — generate proforma/final
salesRouter.post(
  '/orders/:id/invoice',
  asyncHandler(async (req, res) => {
    const invoice = await salesService.generateInvoice(Number(req.params.id), req.body.invoiceType);
    res.status(201).json(invoice);
  }),
);
