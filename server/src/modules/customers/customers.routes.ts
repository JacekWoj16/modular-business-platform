import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as customersService from './customers.service';

export const customersRouter = Router();

// GET /api/modules/customers — list (paginated, searchable)
customersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, page, pageSize, includeInactive } = req.query;
    const result = await customersService.listCustomers({
      search: typeof search === 'string' ? search : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      includeInactive: includeInactive === 'true',
    });
    res.json(result);
  }),
);

// GET /api/modules/customers/:id — single customer
customersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await customersService.getCustomer(Number(req.params.id));
    res.json(customer);
  }),
);

// POST /api/modules/customers — create
customersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const customer = await customersService.createCustomer(req.body);
    res.status(201).json(customer);
  }),
);

// PATCH /api/modules/customers/:id — update
customersRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await customersService.updateCustomer(Number(req.params.id), req.body);
    res.json(customer);
  }),
);

// DELETE /api/modules/customers/:id — soft delete (is_active = false)
customersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await customersService.deleteCustomer(Number(req.params.id));
    res.status(204).send();
  }),
);
