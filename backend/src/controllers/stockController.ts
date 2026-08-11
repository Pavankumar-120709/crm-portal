import { Response } from 'express';
import { StockRepository } from '../repositories/stockRepo';
import { sendError, sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

const stockRepo = new StockRepository();

export async function addStockMovement(req: AuthenticatedRequest, res: Response) {
  try {
    const { product_id, quantity, movement_type, reason } = req.body;

    if (!product_id || !quantity || !movement_type) {
      return sendError(res, 'product_id, quantity, and movement_type are required', 400);
    }

    if (!['IN', 'OUT'].includes(movement_type)) {
      return sendError(res, "movement_type must be either 'IN' or 'OUT'", 400);
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return sendError(res, 'Quantity must be a positive integer', 400);
    }

    const result = await stockRepo.addMovement({
      product_id: parseInt(product_id, 10),
      quantity: parsedQty,
      movement_type,
      reason,
      created_by: req.user?.id,
    });

    return sendSuccess(res, result, `Stock updated successfully (${movement_type} ${parsedQty})`, 201);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message || 'Failed to adjust stock', statusCode);
  }
}

export async function getAllStockMovements(req: AuthenticatedRequest, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const movements = await stockRepo.getAllMovements(limit);
    return sendSuccess(res, movements);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch stock movements', 500);
  }
}
