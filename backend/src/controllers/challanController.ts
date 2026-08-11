import { Request, Response } from 'express';
import { ChallanRepository } from '../repositories/challanRepo';
import { sendError, sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

const challanRepo = new ChallanRepository();

export async function getChallans(req: Request, res: Response) {
  try {
    const { status, search, page, limit } = req.query;

    const result = await challanRepo.findAll({
      status: status ? (String(status) as any) : undefined,
      search: search ? String(search) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 10,
    });

    const currentPage = page ? parseInt(String(page), 10) : 1;
    const currentLimit = limit ? parseInt(String(limit), 10) : 10;
    const totalPages = Math.ceil(result.total / currentLimit) || 1;

    return sendSuccess(res, result.challans, undefined, 200, {
      total: result.total,
      page: currentPage,
      limit: currentLimit,
      totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch challans', 500);
  }
}

export async function getChallanById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const challan = await challanRepo.findById(id);

    if (!challan) {
      return sendError(res, 'Challan not found', 404);
    }

    return sendSuccess(res, challan);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch challan', 500);
  }
}

export async function createChallan(req: AuthenticatedRequest, res: Response) {
  try {
    const { customer_id, items } = req.body;

    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'customer_id and at least one item are required', 400);
    }

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return sendError(res, 'Each item must have a valid product_id and quantity > 0', 400);
      }
    }

    const challan = await challanRepo.createDraft({
      customer_id: parseInt(customer_id, 10),
      items: items.map((i: any) => ({
        product_id: parseInt(i.product_id, 10),
        quantity: parseInt(i.quantity, 10),
      })),
      created_by: req.user?.id,
    });

    return sendSuccess(res, challan, 'Draft challan created successfully', 201);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message || 'Failed to create challan', statusCode);
  }
}

export async function confirmChallan(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const confirmedChallan = await challanRepo.confirmChallan(id, req.user?.id);
    return sendSuccess(res, confirmedChallan, 'Challan confirmed and stock updated');
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message || 'Failed to confirm challan', statusCode);
  }
}

export async function cancelChallan(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const cancelledChallan = await challanRepo.cancelChallan(id, req.user?.id);
    return sendSuccess(res, cancelledChallan, 'Challan cancelled successfully');
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message || 'Failed to cancel challan', statusCode);
  }
}
