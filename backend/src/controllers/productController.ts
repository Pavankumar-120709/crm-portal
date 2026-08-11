import { Request, Response } from 'express';
import { ProductRepository } from '../repositories/productRepo';
import { StockRepository } from '../repositories/stockRepo';
import { sendError, sendSuccess } from '../utils/response';

const productRepo = new ProductRepository();
const stockRepo = new StockRepository();

export async function getProducts(req: Request, res: Response) {
  try {
    const { search, category, lowStock, page, limit } = req.query;

    const result = await productRepo.findAll({
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      lowStockOnly: lowStock === 'true',
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 10,
    });

    const currentPage = page ? parseInt(String(page), 10) : 1;
    const currentLimit = limit ? parseInt(String(limit), 10) : 10;
    const totalPages = Math.ceil(result.total / currentLimit) || 1;

    return sendSuccess(res, result.products, undefined, 200, {
      total: result.total,
      page: currentPage,
      limit: currentLimit,
      totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch products', 500);
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await productRepo.findById(id);

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, product);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch product', 500);
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const { product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location } = req.body;

    if (!product_name || !sku || !category) {
      return sendError(res, 'Product name, SKU, and category are required', 400);
    }

    const existingSku = await productRepo.findBySku(sku);
    if (existingSku) {
      return sendError(res, `SKU '${sku}' already exists`, 409);
    }

    const newProduct = await productRepo.create({
      product_name,
      sku,
      category,
      unit_price: parseFloat(unit_price) || 0,
      current_stock: parseInt(current_stock, 10) || 0,
      minimum_stock: parseInt(minimum_stock, 10) || 0,
      warehouse_location,
    });

    return sendSuccess(res, newProduct, 'Product created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create product', 500);
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedProduct = await productRepo.update(id, req.body);

    if (!updatedProduct) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, updatedProduct, 'Product updated successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update product', 500);
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await productRepo.delete(id);

    if (!deleted) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, null, 'Product deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete product', 500);
  }
}

export async function getProductMovements(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const movements = await stockRepo.getMovementsByProductId(id);
    return sendSuccess(res, movements);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch product stock movements', 500);
  }
}
