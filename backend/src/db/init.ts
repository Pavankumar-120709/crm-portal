import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool, isPostgres, query, dbMode } from '../config/db';

export async function initDb() {
  console.log(`⚡ Initializing Database Schema & Seeding Initial Data (Engine: ${dbMode})...`);
  const client = await pool.connect();
  try {
    // 1. Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    if (isPostgres) {
      await client.query(schemaSql);
    } else {
      // Execute DDL for SQLite / Local Store
      schemaSql = schemaSql
        .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
        .replace(/NUMERIC\(12,\s*2\)/g, 'NUMERIC');

      const statements = schemaSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await query(statement);
      }
    }
    console.log('✅ Schema tables & indexes verified/created.');

    // 2. Check if users table already has admin
    const userCheck = await query(`SELECT COUNT(*) as count FROM users;`);
    const userCount = parseInt(userCheck.rows[0]?.count || 0, 10);

    if (userCount === 0) {
      console.log('🌱 Seeding initial application data...');

      const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

      // Seed Users
      const userRes1 = await query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, role`,
        ['System Administrator', 'admin@erp.com', defaultPasswordHash, 'ADMIN']
      );
      const userRes2 = await query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, role`,
        ['Sales Representative', 'sales@erp.com', defaultPasswordHash, 'SALES']
      );
      const userRes3 = await query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, role`,
        ['Warehouse Manager', 'warehouse@erp.com', defaultPasswordHash, 'WAREHOUSE']
      );
      await query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, role`,
        ['Accounts Officer', 'accounts@erp.com', defaultPasswordHash, 'ACCOUNTS']
      );

      const adminId = userRes1.rows[0]?.id || 1;
      const salesId = userRes2.rows[0]?.id || 2;
      const whId = userRes3.rows[0]?.id || 3;

      // Seed Customers
      const c1Res = await query(`
        INSERT INTO customers (customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
      `, ['Acme Logistics Corp', '+1 555-0192', 'procurement@acmelogistics.com', 'Acme Logistics LLC', '27AAACA12341Z1', 'WHOLESALE', '100 Industrial Parkway, Suite 400', 'ACTIVE', '2026-08-20', 'Key wholesale client. Prefers monthly billing.']);

      const c2Res = await query(`
        INSERT INTO customers (customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
      `, ['Apex Technologies', '+1 555-0188', 'contact@apextech.io', 'Apex Tech Solutions', '27BBBBB56782Z2', 'DISTRIBUTOR', '450 Tech Avenue, Floor 12', 'ACTIVE', '2026-08-15', 'Distributor for regional market.']);

      await query(`
        INSERT INTO customers (customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, ['Global Trading Co', '+1 555-0144', 'info@globaltrading.org', 'Global Trading Inc', '27CCCCC90123Z3', 'RETAIL', '88 Commercial Street', 'LEAD', '2026-08-18', 'Initial contact made. Requested quote for 500 units.']);

      await query(`
        INSERT INTO customers (customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, ['Vanguard Retailers', '+1 555-0177', 'buy@vanguardretail.com', 'Vanguard Retail Ltd', '27DDDDD34564Z4', 'RETAIL', '12 Plaza Boulevard', 'INACTIVE', null, 'Account currently paused.']);

      const c1Id = c1Res.rows[0]?.id || 1;
      const c2Id = c2Res.rows[0]?.id || 2;

      // Seed Products
      const p1Res = await query(`
        INSERT INTO products (product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location) VALUES
        ($1, $2, $3, $4, $5, $6, $7) RETURNING id, product_name, sku, unit_price
      `, ['Ergonomic Executive Desk', 'FURN-DESK-001', 'Furniture', 450.00, 25, 5, 'Aisle A1 - Bay 4']);

      const p2Res = await query(`
        INSERT INTO products (product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location) VALUES
        ($1, $2, $3, $4, $5, $6, $7) RETURNING id, product_name, sku, unit_price
      `, ['High-Back Mesh Office Chair', 'FURN-CHAIR-002', 'Furniture', 180.00, 40, 10, 'Aisle A2 - Bay 1']);

      const p3Res = await query(`
        INSERT INTO products (product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location) VALUES
        ($1, $2, $3, $4, $5, $6, $7) RETURNING id, product_name, sku, unit_price
      `, ['Wireless Mechanical Keyboard', 'ELEC-KEYB-003', 'Electronics', 85.50, 12, 15, 'Aisle B1 - Bin 09']);

      const p4Res = await query(`
        INSERT INTO products (product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location) VALUES
        ($1, $2, $3, $4, $5, $6, $7) RETURNING id, product_name, sku, unit_price
      `, ['Ultra-Wide 34-Inch Monitor', 'ELEC-MON-004', 'Electronics', 520.00, 8, 10, 'Aisle B2 - Bin 02']);

      await query(`
        INSERT INTO products (product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location) VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      `, ['Heavy Duty Paper Shredder', 'OFF-SHRED-005', 'Office Equipment', 129.99, 18, 5, 'Aisle C1 - Bin 15']);

      const p1 = p1Res.rows[0] || { id: 1, product_name: 'Ergonomic Executive Desk', sku: 'FURN-DESK-001', unit_price: 450.00 };
      const p2 = p2Res.rows[0] || { id: 2, product_name: 'High-Back Mesh Office Chair', sku: 'FURN-CHAIR-002', unit_price: 180.00 };
      const p3 = p3Res.rows[0] || { id: 3, product_name: 'Wireless Mechanical Keyboard', sku: 'ELEC-KEYB-003', unit_price: 85.50 };
      const p4 = p4Res.rows[0] || { id: 4, product_name: 'Ultra-Wide 34-Inch Monitor', sku: 'ELEC-MON-004', unit_price: 520.00 };

      // Seed Stock Movements
      await query(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES ($1, 25, 'IN', 'Initial Inventory Intake', $2)`, [p1.id, whId]);
      await query(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES ($1, 40, 'IN', 'Initial Inventory Intake', $2)`, [p2.id, whId]);
      await query(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES ($1, 20, 'IN', 'Initial Stock Intake', $2)`, [p3.id, whId]);
      await query(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES ($1, 8, 'OUT', 'Damaged in transit return', $2)`, [p3.id, whId]);
      await query(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES ($1, 8, 'IN', 'Initial Stock Intake', $2)`, [p4.id, whId]);

      // Seed Initial Draft & Confirmed Challans
      const ch1Res = await query(`
        INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by)
        VALUES ('CH-2026-0001', $1, 5, 'CONFIRMED', $2) RETURNING id
      `, [c1Id, salesId]);

      const ch1Id = ch1Res.rows[0]?.id || 1;

      await query(`
        INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, quantity, subtotal)
        VALUES ($1, $2, $3, $4, $5, 2, $6)
      `, [ch1Id, p1.id, p1.product_name, p1.sku, p1.unit_price, p1.unit_price * 2]);

      await query(`
        INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, quantity, subtotal)
        VALUES ($1, $2, $3, $4, $5, 3, $6)
      `, [ch1Id, p2.id, p2.product_name, p2.sku, p2.unit_price, p2.unit_price * 3]);

      const ch2Res = await query(`
        INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by)
        VALUES ('CH-2026-0002', $1, 2, 'DRAFT', $2) RETURNING id
      `, [c2Id, salesId]);

      const ch2Id = ch2Res.rows[0]?.id || 2;

      await query(`
        INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, quantity, subtotal)
        VALUES ($1, $2, $3, $4, $5, 2, $6)
      `, [ch2Id, p4.id, p4.product_name, p4.sku, p4.unit_price, p4.unit_price * 2]);

      console.log('✅ Default users, customers, products, and challans seeded successfully.');
    } else {
      console.log('ℹ️ Database already contains user records. Skipping seed.');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    if (client && typeof client.release === 'function') {
      client.release();
    }
  }
}

if (require.main === module) {
  initDb().then(() => {
    console.log('🎉 DB setup finished.');
    process.exit(0);
  }).catch((err) => {
    console.error('DB setup failed:', err);
    process.exit(1);
  });
}
