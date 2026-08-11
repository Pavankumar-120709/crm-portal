import { pool, query } from '../config/db';
import { Challan, ChallanItemInput, ChallanStatus } from '../types';

export class ChallanRepository {
  private generateChallanNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CH-${dateStr}-${random}`;
  }

  async findAll(params: {
    status?: ChallanStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ challans: Challan[]; total: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.status) {
      conditions.push(`ch.status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }

    if (params.search) {
      conditions.push(`(ch.challan_number ILIKE $${paramIndex} OR c.customer_name ILIKE $${paramIndex} OR c.business_name ILIKE $${paramIndex})`);
      values.push(`%${params.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) 
      FROM challans ch
      JOIN customers c ON ch.customer_id = c.id
      ${whereClause}
    `;
    const countRes = await query(countQuery, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataQuery = `
      SELECT ch.*, c.customer_name, u.name as created_by_name
      FROM challans ch
      JOIN customers c ON ch.customer_id = c.id
      LEFT JOIN users u ON ch.created_by = u.id
      ${whereClause}
      ORDER BY ch.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await query(dataQuery, [...values, limit, offset]);

    return { challans: dataRes.rows, total };
  }

  async findById(id: number): Promise<Challan | null> {
    const challanRes = await query(
      `SELECT ch.*, c.customer_name, c.mobile as customer_mobile, c.email as customer_email, c.address as customer_address, u.name as created_by_name
       FROM challans ch
       JOIN customers c ON ch.customer_id = c.id
       LEFT JOIN users u ON ch.created_by = u.id
       WHERE ch.id = $1`,
      [id]
    );

    if (challanRes.rows.length === 0) return null;

    const itemsRes = await query(
      `SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY id ASC`,
      [id]
    );

    return {
      ...challanRes.rows[0],
      items: itemsRes.rows,
    };
  }

  async createDraft(data: {
    customer_id: number;
    items: ChallanItemInput[];
    created_by?: number;
  }): Promise<Challan> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const challanNumber = this.generateChallanNumber();
      let totalQuantity = 0;

      // 1. Validate customer
      const custRes = await client.query('SELECT id FROM customers WHERE id = $1', [data.customer_id]);
      if (custRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Customer not found' };
      }

      // 2. Fetch product snapshots
      const productIds = data.items.map((i) => i.product_id);
      const prodRes = await client.query('SELECT id, product_name, sku, unit_price FROM products WHERE id = ANY($1)', [productIds]);
      const productMap = new Map<number, any>(prodRes.rows.map((p: any) => [p.id, p]));

      for (const item of data.items) {
        if (!productMap.has(item.product_id)) {
          throw { statusCode: 400, message: `Product with ID ${item.product_id} not found` };
        }
        totalQuantity += item.quantity;
      }

      // 3. Create challan record (DRAFT)
      const challanRes = await client.query(
        `INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by)
         VALUES ($1, $2, $3, 'DRAFT', $4)
         RETURNING *`,
        [challanNumber, data.customer_id, totalQuantity, data.created_by || null]
      );
      const challan = challanRes.rows[0];

      // 4. Create challan_items with snapshots
      for (const item of data.items) {
        const prod: any = productMap.get(item.product_id);
        const unitPrice = parseFloat(prod.unit_price);
        const subtotal = unitPrice * item.quantity;

        await client.query(
          `INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [challan.id, prod.id, prod.product_name, prod.sku, unitPrice, item.quantity, subtotal]
        );
      }

      await client.query('COMMIT');
      return this.findById(challan.id) as Promise<Challan>;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async confirmChallan(challanId: number, userId?: number): Promise<Challan> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch & lock challan
      const challanRes = await client.query(
        'SELECT * FROM challans WHERE id = $1 FOR UPDATE',
        [challanId]
      );

      if (challanRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Challan not found' };
      }

      const challan = challanRes.rows[0];
      if (challan.status === 'CONFIRMED') {
        throw { statusCode: 400, message: 'Challan is already confirmed' };
      }
      if (challan.status === 'CANCELLED') {
        throw { statusCode: 400, message: 'Cannot confirm a cancelled challan' };
      }

      // 2. Fetch challan items
      const itemsRes = await client.query('SELECT * FROM challan_items WHERE challan_id = $1', [challanId]);
      const items = itemsRes.rows;

      if (items.length === 0) {
        throw { statusCode: 400, message: 'Challan has no line items' };
      }

      // 3. Lock products and check stock for all items
      for (const item of items) {
        const prodRes = await client.query(
          'SELECT id, product_name, current_stock FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );

        if (prodRes.rows.length === 0) {
          throw { statusCode: 404, message: `Product ${item.product_name_snapshot} no longer exists` };
        }

        const product = prodRes.rows[0];
        if (product.current_stock < item.quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for product "${product.product_name}". Required: ${item.quantity}, Available: ${product.current_stock}`,
          };
        }
      }

      // 4. Stock is sufficient for all items. Execute stock reduction & movement records
      for (const item of items) {
        await client.query(
          'UPDATE products SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.quantity, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [item.product_id, item.quantity, `Challan Dispatch (${challan.challan_number})`, userId || challan.created_by]
        );
      }

      // 5. Update challan status to CONFIRMED
      await client.query(
        `UPDATE challans SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [challanId]
      );

      await client.query('COMMIT');
      return (await this.findById(challanId))!;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelChallan(challanId: number, userId?: number): Promise<Challan> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const challanRes = await client.query(
        'SELECT * FROM challans WHERE id = $1 FOR UPDATE',
        [challanId]
      );

      if (challanRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Challan not found' };
      }

      const challan = challanRes.rows[0];
      if (challan.status === 'CANCELLED') {
        throw { statusCode: 400, message: 'Challan is already cancelled' };
      }

      if (challan.status === 'CONFIRMED') {
        const itemsRes = await client.query('SELECT * FROM challan_items WHERE challan_id = $1', [challanId]);
        for (const item of itemsRes.rows) {
          await client.query(
            'UPDATE products SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [item.quantity, item.product_id]
          );

          await client.query(
            `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
             VALUES ($1, $2, 'IN', $3, $4)`,
            [item.product_id, item.quantity, `Cancelled Challan Restoration (${challan.challan_number})`, userId || challan.created_by]
          );
        }
      }

      await client.query(
        `UPDATE challans SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [challanId]
      );

      await client.query('COMMIT');
      return (await this.findById(challanId))!;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getMetrics(): Promise<{ totalChallans: number; draftChallans: number; confirmedChallans: number }> {
    const res = await query(`
      SELECT 
        COUNT(*)::int AS total_challans,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END)::int AS draft_challans,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END)::int AS confirmed_challans
      FROM challans
    `);
    return {
      totalChallans: res.rows[0].total_challans || 0,
      draftChallans: res.rows[0].draft_challans || 0,
      confirmedChallans: res.rows[0].confirmed_challans || 0,
    };
  }

  async getRecentChallans(limit: number = 5): Promise<Challan[]> {
    const res = await query(`
      SELECT ch.*, c.customer_name, u.name as created_by_name
      FROM challans ch
      JOIN customers c ON ch.customer_id = c.id
      LEFT JOIN users u ON ch.created_by = u.id
      ORDER BY ch.created_at DESC
      LIMIT $1
    `, [limit]);
    return res.rows;
  }
}
