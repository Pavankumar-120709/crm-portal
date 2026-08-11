import { query } from '../config/db';
import { Customer, CustomerStatus, CustomerType } from '../types';

export class CustomerRepository {
  async findAll(params: {
    search?: string;
    status?: CustomerStatus;
    customer_type?: CustomerType;
    page?: number;
    limit?: number;
  }): Promise<{ customers: Customer[]; total: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.search) {
      conditions.push(`(
        customer_name ILIKE $${paramIndex} OR
        business_name ILIKE $${paramIndex} OR
        mobile ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex}
      )`);
      values.push(`%${params.search}%`);
      paramIndex++;
    }

    if (params.status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }

    if (params.customer_type) {
      conditions.push(`customer_type = $${paramIndex}`);
      values.push(params.customer_type);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
    const countRes = await query(countQuery, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataQuery = `
      SELECT * FROM customers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await query(dataQuery, [...values, limit, offset]);

    return { customers: dataRes.rows, total };
  }

  async findById(id: number): Promise<Customer | null> {
    const res = await query('SELECT * FROM customers WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    const res = await query(
      `INSERT INTO customers 
       (customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.customer_name,
        data.mobile,
        data.email || null,
        data.business_name || null,
        data.gst_number || null,
        data.customer_type || 'RETAIL',
        data.address || null,
        data.status || 'LEAD',
        data.follow_up_date || null,
        data.notes || null,
      ]
    );
    return res.rows[0];
  }

  async update(id: number, data: Partial<Customer>): Promise<Customer | null> {
    const res = await query(
      `UPDATE customers
       SET customer_name = COALESCE($1, customer_name),
           mobile = COALESCE($2, mobile),
           email = COALESCE($3, email),
           business_name = COALESCE($4, business_name),
           gst_number = COALESCE($5, gst_number),
           customer_type = COALESCE($6, customer_type),
           address = COALESCE($7, address),
           status = COALESCE($8, status),
           follow_up_date = $9,
           notes = COALESCE($10, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        data.customer_name,
        data.mobile,
        data.email,
        data.business_name,
        data.gst_number,
        data.customer_type,
        data.address,
        data.status,
        data.follow_up_date === undefined ? null : data.follow_up_date,
        data.notes,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const res = await query('DELETE FROM customers WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async countTotal(): Promise<number> {
    const res = await query('SELECT COUNT(*) FROM customers');
    return parseInt(res.rows[0].count, 10);
  }
}
