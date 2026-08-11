import { query } from '../config/db';
import { Product } from '../types';

export class ProductRepository {
  async findAll(params: {
    search?: string;
    category?: string;
    lowStockOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.search) {
      conditions.push(`(product_name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`);
      values.push(`%${params.search}%`);
      paramIndex++;
    }

    if (params.category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(params.category);
      paramIndex++;
    }

    if (params.lowStockOnly) {
      conditions.push(`current_stock <= minimum_stock`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
    const countRes = await query(countQuery, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataQuery = `
      SELECT * FROM products
      ${whereClause}
      ORDER BY product_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await query(dataQuery, [...values, limit, offset]);

    return { products: dataRes.rows, total };
  }

  async findById(id: number): Promise<Product | null> {
    const res = await query('SELECT * FROM products WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const res = await query('SELECT * FROM products WHERE UPPER(sku) = UPPER($1)', [sku]);
    return res.rows[0] || null;
  }

  async create(data: Partial<Product>): Promise<Product> {
    const res = await query(
      `INSERT INTO products (product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location)
       VALUES ($1, UPPER($2), $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.product_name,
        data.sku,
        data.category,
        data.unit_price || 0,
        data.current_stock || 0,
        data.minimum_stock || 0,
        data.warehouse_location || null,
      ]
    );
    return res.rows[0];
  }

  async update(id: number, data: Partial<Product>): Promise<Product | null> {
    const res = await query(
      `UPDATE products
       SET product_name = COALESCE($1, product_name),
           sku = COALESCE(UPPER($2), sku),
           category = COALESCE($3, category),
           unit_price = COALESCE($4, unit_price),
           current_stock = COALESCE($5, current_stock),
           minimum_stock = COALESCE($6, minimum_stock),
           warehouse_location = COALESCE($7, warehouse_location),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        data.product_name,
        data.sku,
        data.category,
        data.unit_price,
        data.current_stock,
        data.minimum_stock,
        data.warehouse_location,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const res = await query('DELETE FROM products WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async getMetrics(): Promise<{ totalProducts: number; totalStockUnits: number; lowStockCount: number }> {
    const res = await query(`
      SELECT 
        COUNT(*)::int AS total_products,
        COALESCE(SUM(current_stock), 0)::int AS total_stock_units,
        COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END)::int AS low_stock_count
      FROM products
    `);
    return {
      totalProducts: res.rows[0].total_products || 0,
      totalStockUnits: res.rows[0].total_stock_units || 0,
      lowStockCount: res.rows[0].low_stock_count || 0,
    };
  }

  async getLowStockProducts(limit: number = 5): Promise<Product[]> {
    const res = await query(
      `SELECT * FROM products WHERE current_stock <= minimum_stock ORDER BY current_stock ASC LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}
