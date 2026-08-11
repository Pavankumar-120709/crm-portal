import { pool, query } from '../config/db';
import { MovementType, StockMovement } from '../types';

export class StockRepository {
  async addMovement(data: {
    product_id: number;
    quantity: number;
    movement_type: MovementType;
    reason?: string;
    created_by?: number;
  }): Promise<{ movement: StockMovement; newStock: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock and fetch current stock
      const productRes = await client.query(
        'SELECT id, product_name, current_stock FROM products WHERE id = $1 FOR UPDATE',
        [data.product_id]
      );

      if (productRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Product not found' };
      }

      const currentStock = productRes.rows[0].current_stock;

      if (data.movement_type === 'OUT' && currentStock < data.quantity) {
        throw { statusCode: 400, message: `Insufficient stock for product ${productRes.rows[0].product_name}. Requested: ${data.quantity}, Available: ${currentStock}` };
      }

      const stockDelta = data.movement_type === 'IN' ? data.quantity : -data.quantity;
      const newStock = currentStock + stockDelta;

      // 2. Update current_stock in products table
      await client.query(
        'UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStock, data.product_id]
      );

      // 3. Create stock_movements record
      const movementRes = await client.query(
        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.product_id, data.quantity, data.movement_type, data.reason || null, data.created_by || null]
      );

      await client.query('COMMIT');
      return { movement: movementRes.rows[0], newStock };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getMovementsByProductId(productId: number, limit: number = 20): Promise<StockMovement[]> {
    const res = await query(
      `SELECT sm.*, p.product_name, p.sku, u.name as created_by_name
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN users u ON sm.created_by = u.id
       WHERE sm.product_id = $1
       ORDER BY sm.created_at DESC
       LIMIT $2`,
      [productId, limit]
    );
    return res.rows;
  }

  async getAllMovements(limit: number = 50): Promise<StockMovement[]> {
    const res = await query(
      `SELECT sm.*, p.product_name, p.sku, u.name as created_by_name
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN users u ON sm.created_by = u.id
       ORDER BY sm.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}
