import { HttpError } from '../../middleware/error.middleware';
import * as customersRepository from './customers.repository';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersParams,
  ListCustomersResult,
} from './customers.types';

export async function listCustomers(params: ListCustomersParams): Promise<ListCustomersResult> {
  return customersRepository.findCustomers(params);
}

export async function getCustomer(id: number): Promise<Customer> {
  const customer = await customersRepository.findCustomerById(id);
  if (!customer) {
    throw new HttpError(404, `Customer ${id} not found`);
  }
  return customer;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  if (!input.name || input.name.trim().length === 0) {
    throw new HttpError(400, 'Customer name is required');
  }
  return customersRepository.insertCustomer(input);
}

export async function updateCustomer(id: number, input: UpdateCustomerInput): Promise<Customer> {
  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new HttpError(400, 'Customer name cannot be empty');
  }
  const updated = await customersRepository.updateCustomerById(id, input);
  if (!updated) {
    throw new HttpError(404, `Customer ${id} not found`);
  }
  return updated;
}

export async function deleteCustomer(id: number): Promise<void> {
  const deleted = await customersRepository.softDeleteCustomerById(id);
  if (!deleted) {
    throw new HttpError(404, `Customer ${id} not found`);
  }
}
