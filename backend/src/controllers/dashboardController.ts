import { Request, Response } from 'express';
import { CustomerRepository } from '../repositories/customerRepo';
import { ProductRepository } from '../repositories/productRepo';
import { ChallanRepository } from '../repositories/challanRepo';
import { StockRepository } from '../repositories/stockRepo';
import { sendError, sendSuccess } from '../utils/response';

const customerRepo = new CustomerRepository();
const productRepo = new ProductRepository();
const challanRepo = new ChallanRepository();
const stockRepo = new StockRepository();

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const totalCustomers = await customerRepo.countTotal();
    const productMetrics = await productRepo.getMetrics();
    const challanMetrics = await challanRepo.getMetrics();

    const recentChallans = await challanRepo.getRecentChallans(5);
    const lowStockProducts = await productRepo.getLowStockProducts(5);
    const recentMovements = await stockRepo.getAllMovements(5);

    return sendSuccess(res, {
      metrics: {
        totalCustomers,
        totalProducts: productMetrics.totalProducts,
        totalStockUnits: productMetrics.totalStockUnits,
        lowStockCount: productMetrics.lowStockCount,
        totalChallans: challanMetrics.totalChallans,
        draftChallans: challanMetrics.draftChallans,
        confirmedChallans: challanMetrics.confirmedChallans,
      },
      recentChallans,
      lowStockProducts,
      recentMovements,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch dashboard statistics', 500);
  }
}
