import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as inventoryService from './inventory.service';

export const inventoryRouter = Router();

// GET /api/modules/inventory/products — list (searchable, filter by low-stock)
inventoryRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { search, lowStock, includeInactive, page, pageSize } = req.query;
    const result = await inventoryService.listProducts({
      search: typeof search === 'string' ? search : undefined,
      lowStockOnly: lowStock === 'true',
      includeInactive: includeInactive === 'true',
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    res.json(result);
  }),
);

// GET /api/modules/inventory/products/:id — single with recent movements
inventoryRouter.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await inventoryService.getProduct(Number(req.params.id));
    res.json(product);
  }),
);

// POST /api/modules/inventory/products — create
inventoryRouter.post(
  '/products',
  asyncHandler(async (req, res) => {
    const product = await inventoryService.createProduct(req.body);
    res.status(201).json(product);
  }),
);

// PATCH /api/modules/inventory/products/:id — update
inventoryRouter.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await inventoryService.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  }),
);

// POST /api/modules/inventory/products/:id/movements — record movement
inventoryRouter.post(
  '/products/:id/movements',
  asyncHandler(async (req, res) => {
    // TODO: once auth middleware attaches req.user, pass its id as createdBy
    // instead of null.
    const result = await inventoryService.recordMovement(Number(req.params.id), req.body, null);
    res.status(201).json(result);
  }),
);
