import { Request, Response } from 'express';
import { CustomerRepository } from '../repositories/customerRepo';
import { sendError, sendSuccess } from '../utils/response';

const customerRepo = new CustomerRepository();

export async function getCustomers(req: Request, res: Response) {
  try {
    const { search, status, customer_type, page, limit } = req.query;

    const result = await customerRepo.findAll({
      search: search ? String(search) : undefined,
      status: status ? (String(status) as any) : undefined,
      customer_type: customer_type ? (String(customer_type) as any) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 10,
    });

    const currentPage = page ? parseInt(String(page), 10) : 1;
    const currentLimit = limit ? parseInt(String(limit), 10) : 10;
    const totalPages = Math.ceil(result.total / currentLimit) || 1;

    return sendSuccess(res, result.customers, undefined, 200, {
      total: result.total,
      page: currentPage,
      limit: currentLimit,
      totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch customers', 500);
  }
}

export async function getCustomerById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const customer = await customerRepo.findById(id);

    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    return sendSuccess(res, customer);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch customer', 500);
  }
}

export async function createCustomer(req: Request, res: Response) {
  try {
    const { customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes } = req.body;

    if (!customer_name || !mobile) {
      return sendError(res, 'Customer name and mobile number are required', 400);
    }

    const newCustomer = await customerRepo.create({
      customer_name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
    });

    return sendSuccess(res, newCustomer, 'Customer created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create customer', 500);
  }
}

export async function updateCustomer(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedCustomer = await customerRepo.update(id, req.body);

    if (!updatedCustomer) {
      return sendError(res, 'Customer not found', 404);
    }

    return sendSuccess(res, updatedCustomer, 'Customer updated successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update customer', 500);
  }
}

export async function deleteCustomer(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await customerRepo.delete(id);

    if (!deleted) {
      return sendError(res, 'Customer not found', 404);
    }

    return sendSuccess(res, null, 'Customer deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete customer', 500);
  }
}
