import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { SCHEMA_SQL } from '../db/schema';

dotenv.config();

const rawConnectionString = process.env.DATABASE_URL || '';

const isPlaceholderUrl =
  !rawConnectionString ||
  rawConnectionString.includes('ep-sample-123456') ||
  rawConnectionString.includes('user:password@');

export let dbMode: 'postgres' | 'sqlite' | 'json' = 'json';

let pgPool: Pool | null = null;

if (!isPlaceholderUrl) {
  dbMode = 'postgres';
  pgPool = new Pool({
    connectionString: rawConnectionString,
    ssl: rawConnectionString.includes('localhost') || rawConnectionString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  });
  pgPool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err.message);
  });
} else {
  dbMode = 'json';
  console.log('ℹ️ Local development mode: Using embedded JSON file store (dev_storage.json)');
}

export const isPostgres = dbMode === 'postgres';

// --- Embedded Storage Engine ---
const jsonFilePath = path.join(__dirname, '../../dev_storage.json');

interface LocalStorage {
  users: any[];
  customers: any[];
  products: any[];
  stock_movements: any[];
  challans: any[];
  challan_items: any[];
}

function getInitialSeededStore(): LocalStorage {
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

  const users = [
    { id: 1, name: 'System Administrator', email: 'admin@erp.com', password_hash: defaultPasswordHash, role: 'ADMIN', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, name: 'Sales Representative', email: 'sales@erp.com', password_hash: defaultPasswordHash, role: 'SALES', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, name: 'Warehouse Manager', email: 'warehouse@erp.com', password_hash: defaultPasswordHash, role: 'WAREHOUSE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, name: 'Accounts Officer', email: 'accounts@erp.com', password_hash: defaultPasswordHash, role: 'ACCOUNTS', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  const customers = [
    { id: 1, customer_name: 'Acme Logistics Corp', mobile: '+1 555-0192', email: 'procurement@acmelogistics.com', business_name: 'Acme Logistics LLC', gst_number: '27AAACA12341Z1', customer_type: 'WHOLESALE', address: '100 Industrial Parkway, Suite 400', status: 'ACTIVE', follow_up_date: '2026-08-20', notes: 'Key wholesale client.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, customer_name: 'Apex Technologies', mobile: '+1 555-0188', email: 'contact@apextech.io', business_name: 'Apex Tech Solutions', gst_number: '27BBBBB56782Z2', customer_type: 'DISTRIBUTOR', address: '450 Tech Avenue, Floor 12', status: 'ACTIVE', follow_up_date: '2026-08-15', notes: 'Distributor for regional market.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, customer_name: 'Global Trading Co', mobile: '+1 555-0144', email: 'info@globaltrading.org', business_name: 'Global Trading Inc', gst_number: '27CCCCC90123Z3', customer_type: 'RETAIL', address: '88 Commercial Street', status: 'LEAD', follow_up_date: '2026-08-18', notes: 'Initial contact made.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  const products = [
    { id: 1, product_name: 'Ergonomic Executive Desk', sku: 'FURN-DESK-001', category: 'Furniture', unit_price: 450.00, current_stock: 25, minimum_stock: 5, warehouse_location: 'Aisle A1 - Bay 4', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, product_name: 'High-Back Mesh Office Chair', sku: 'FURN-CHAIR-002', category: 'Furniture', unit_price: 180.00, current_stock: 40, minimum_stock: 10, warehouse_location: 'Aisle A2 - Bay 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, product_name: 'Wireless Mechanical Keyboard', sku: 'ELEC-KEYB-003', category: 'Electronics', unit_price: 85.50, current_stock: 12, minimum_stock: 15, warehouse_location: 'Aisle B1 - Bin 09', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, product_name: 'Ultra-Wide 34-Inch Monitor', sku: 'ELEC-MON-004', category: 'Electronics', unit_price: 520.00, current_stock: 8, minimum_stock: 10, warehouse_location: 'Aisle B2 - Bin 02', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  const stock_movements = [
    { id: 1, product_id: 1, quantity: 25, movement_type: 'IN', reason: 'Initial Inventory Intake', created_by: 3, created_at: new Date().toISOString() },
    { id: 2, product_id: 2, quantity: 40, movement_type: 'IN', reason: 'Initial Inventory Intake', created_by: 3, created_at: new Date().toISOString() },
  ];

  const challans = [
    { id: 1, challan_number: 'CH-2026-0001', customer_id: 1, total_quantity: 5, status: 'CONFIRMED', created_by: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  const challan_items = [
    { id: 1, challan_id: 1, product_id: 1, product_name_snapshot: 'Ergonomic Executive Desk', sku_snapshot: 'FURN-DESK-001', unit_price_snapshot: 450.00, quantity: 2, subtotal: 900.00 },
  ];

  return { users, customers, products, stock_movements, challans, challan_items };
}

function loadStore(): LocalStorage {
  if (fs.existsSync(jsonFilePath)) {
    try {
      const data = fs.readFileSync(jsonFilePath, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        return parsed;
      }
    } catch (e) {}
  }
  const store = getInitialSeededStore();
  saveStore(store);
  return store;
}

function saveStore(data: LocalStorage) {
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

let isAutoInitializingPg = false;

// Unified Query Handler
export async function query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  // 1. PostgreSQL Engine
  if (dbMode === 'postgres' && pgPool) {
    try {
      const res = await pgPool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
    } catch (err: any) {
      // If table doesn't exist yet (42P01), trigger DDL init automatically using embedded SCHEMA_SQL
      if (err.code === '42P01' && !isAutoInitializingPg) {
        isAutoInitializingPg = true;
        try {
          console.log('⚡ Missing database tables detected. Auto-executing Postgres schema initialization...');
          await pgPool.query(SCHEMA_SQL);
          const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
          await pgPool.query(`
            INSERT INTO users (name, email, password_hash, role) VALUES
            ('System Administrator', 'admin@erp.com', '${defaultPasswordHash}', 'ADMIN'),
            ('Sales Representative', 'sales@erp.com', '${defaultPasswordHash}', 'SALES'),
            ('Warehouse Manager', 'warehouse@erp.com', '${defaultPasswordHash}', 'WAREHOUSE'),
            ('Accounts Officer', 'accounts@erp.com', '${defaultPasswordHash}', 'ACCOUNTS')
            ON CONFLICT (email) DO NOTHING;
          `);
          isAutoInitializingPg = false;
          const retryRes = await pgPool.query(text, params);
          return { rows: retryRes.rows, rowCount: retryRes.rowCount ?? retryRes.rows.length };
        } catch (initErr) {
          isAutoInitializingPg = false;
        }
      }

      // If connection fails (authentication / invalid host), fall back to local store
      if (err.code === '28P01' || err.message?.includes('password authentication failed') || err.message?.includes('ECONNREFUSED')) {
        console.warn(`⚠️ PostgreSQL connection failed (${err.message}). Falling back to local embedded store...`);
        dbMode = 'json';
        return query(text, params);
      }
      throw err;
    }
  }

  // 2. Embedded Storage Engine (Zero Dependency Fallback)
  const store = loadStore();
  const sqlUpper = text.toUpperCase().trim();

  // DDL Commands (CREATE TABLE, CREATE INDEX)
  if (sqlUpper.startsWith('CREATE TABLE') || sqlUpper.startsWith('CREATE INDEX')) {
    saveStore(store);
    return { rows: [], rowCount: 0 };
  }

  // Users Queries
  if (sqlUpper.includes('FROM USERS') || sqlUpper.includes('INTO USERS')) {
    if (sqlUpper.startsWith('SELECT COUNT(*)')) {
      return { rows: [{ count: store.users.length }], rowCount: 1 };
    }
    if (sqlUpper.includes('WHERE LOWER(EMAIL) = LOWER')) {
      const targetEmail = String(params[0]).toLowerCase();
      const user = store.users.find((u) => u.email.toLowerCase() === targetEmail);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    if (sqlUpper.includes('WHERE ID =')) {
      const id = Number(params[0]);
      const user = store.users.find((u) => u.id === id);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    if (sqlUpper.startsWith('SELECT') && sqlUpper.includes('ORDER BY')) {
      return { rows: [...store.users].reverse(), rowCount: store.users.length };
    }
    if (sqlUpper.startsWith('INSERT INTO USERS')) {
      const newUser = {
        id: store.users.length + 1,
        name: params[0],
        email: String(params[1]).toLowerCase(),
        password_hash: params[2],
        role: params[3],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.users.push(newUser);
      saveStore(store);
      return { rows: [newUser], rowCount: 1 };
    }
  }

  // Customers Queries
  if (sqlUpper.includes('FROM CUSTOMERS') || sqlUpper.includes('INTO CUSTOMERS') || sqlUpper.includes('UPDATE CUSTOMERS') || sqlUpper.includes('DELETE FROM CUSTOMERS')) {
    if (sqlUpper.startsWith('SELECT COUNT(*)')) {
      let filtered = store.customers;
      if (params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('%')) {
        const s = params[0].replace(/%/g, '').toLowerCase();
        filtered = filtered.filter((c) =>
          (c.customer_name && c.customer_name.toLowerCase().includes(s)) ||
          (c.business_name && c.business_name.toLowerCase().includes(s)) ||
          (c.mobile && c.mobile.toLowerCase().includes(s)) ||
          (c.email && c.email.toLowerCase().includes(s))
        );
      }
      return { rows: [{ count: filtered.length }], rowCount: 1 };
    }
    if (sqlUpper.includes('WHERE ID =')) {
      const id = Number(params[params.length - 1]);
      if (sqlUpper.startsWith('DELETE')) {
        const idx = store.customers.findIndex((c) => c.id === id);
        if (idx !== -1) store.customers.splice(idx, 1);
        saveStore(store);
        return { rows: [], rowCount: idx !== -1 ? 1 : 0 };
      }
      const customer = store.customers.find((c) => c.id === id);
      return { rows: customer ? [customer] : [], rowCount: customer ? 1 : 0 };
    }
    if (sqlUpper.startsWith('SELECT')) {
      let result = [...store.customers];
      if (params.length >= 2 && typeof params[0] === 'string' && params[0].startsWith('%')) {
        const s = params[0].replace(/%/g, '').toLowerCase();
        result = result.filter((c) =>
          (c.customer_name && c.customer_name.toLowerCase().includes(s)) ||
          (c.business_name && c.business_name.toLowerCase().includes(s)) ||
          (c.mobile && c.mobile.toLowerCase().includes(s)) ||
          (c.email && c.email.toLowerCase().includes(s))
        );
      }
      const limit = Number(params[params.length - 2]) || 10;
      const offset = Number(params[params.length - 1]) || 0;
      const paged = result.slice(offset, offset + limit);
      return { rows: paged, rowCount: paged.length };
    }
    if (sqlUpper.startsWith('INSERT INTO CUSTOMERS')) {
      const newCust = {
        id: store.customers.length + 1,
        customer_name: params[0],
        mobile: params[1],
        email: params[2] || null,
        business_name: params[3] || null,
        gst_number: params[4] || null,
        customer_type: params[5] || 'RETAIL',
        address: params[6] || null,
        status: params[7] || 'LEAD',
        follow_up_date: params[8] || null,
        notes: params[9] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.customers.push(newCust);
      saveStore(store);
      return { rows: [newCust], rowCount: 1 };
    }
    if (sqlUpper.startsWith('UPDATE CUSTOMERS')) {
      const id = Number(params[10]);
      const cust = store.customers.find((c) => c.id === id);
      if (cust) {
        if (params[0] !== null && params[0] !== undefined) cust.customer_name = params[0];
        if (params[1] !== null && params[1] !== undefined) cust.mobile = params[1];
        if (params[2] !== null && params[2] !== undefined) cust.email = params[2];
        if (params[3] !== null && params[3] !== undefined) cust.business_name = params[3];
        if (params[4] !== null && params[4] !== undefined) cust.gst_number = params[4];
        if (params[5] !== null && params[5] !== undefined) cust.customer_type = params[5];
        if (params[6] !== null && params[6] !== undefined) cust.address = params[6];
        if (params[7] !== null && params[7] !== undefined) cust.status = params[7];
        if (params[8] !== undefined) cust.follow_up_date = params[8];
        if (params[9] !== null && params[9] !== undefined) cust.notes = params[9];
        cust.updated_at = new Date().toISOString();
      }
      saveStore(store);
      return { rows: cust ? [cust] : [], rowCount: cust ? 1 : 0 };
    }
  }

  // Products Queries
  if (sqlUpper.includes('FROM PRODUCTS') || sqlUpper.includes('INTO PRODUCTS') || sqlUpper.includes('UPDATE PRODUCTS') || sqlUpper.includes('DELETE FROM PRODUCTS')) {
    if (sqlUpper.includes('COUNT(*)') && sqlUpper.includes('TOTAL_STOCK_UNITS')) {
      const totalProducts = store.products.length;
      const totalStockUnits = store.products.reduce((acc, p) => acc + Number(p.current_stock || 0), 0);
      const lowStockCount = store.products.filter((p) => Number(p.current_stock) <= Number(p.minimum_stock)).length;
      return { rows: [{ total_products: totalProducts, total_stock_units: totalStockUnits, low_stock_count: lowStockCount }], rowCount: 1 };
    }
    if (sqlUpper.startsWith('SELECT COUNT(*)')) {
      return { rows: [{ count: store.products.length }], rowCount: 1 };
    }
    if (sqlUpper.includes('WHERE UPPER(SKU) = UPPER')) {
      const sku = String(params[0]).toUpperCase();
      const p = store.products.find((prod) => String(prod.sku).toUpperCase() === sku);
      return { rows: p ? [p] : [], rowCount: p ? 1 : 0 };
    }
    if (sqlUpper.includes('WHERE ID =')) {
      const id = Number(params[params.length - 1]);
      if (sqlUpper.startsWith('DELETE')) {
        const idx = store.products.findIndex((p) => p.id === id);
        if (idx !== -1) store.products.splice(idx, 1);
        saveStore(store);
        return { rows: [], rowCount: idx !== -1 ? 1 : 0 };
      }
      const prod = store.products.find((p) => p.id === id);
      return { rows: prod ? [prod] : [], rowCount: prod ? 1 : 0 };
    }
    if (sqlUpper.startsWith('SELECT')) {
      let result = [...store.products];
      if (sqlUpper.includes('CURRENT_STOCK <= MINIMUM_STOCK')) {
        result = result.filter((p) => Number(p.current_stock) <= Number(p.minimum_stock));
      }
      const limit = Number(params[params.length - 2]) || 10;
      const offset = Number(params[params.length - 1]) || 0;
      const paged = result.slice(offset, offset + limit);
      return { rows: paged, rowCount: paged.length };
    }
    if (sqlUpper.startsWith('INSERT INTO PRODUCTS')) {
      const newProd = {
        id: store.products.length + 1,
        product_name: params[0],
        sku: String(params[1]).toUpperCase(),
        category: params[2],
        unit_price: Number(params[3]) || 0,
        current_stock: Number(params[4]) || 0,
        minimum_stock: Number(params[5]) || 0,
        warehouse_location: params[6] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.products.push(newProd);
      saveStore(store);
      return { rows: [newProd], rowCount: 1 };
    }
    if (sqlUpper.startsWith('UPDATE PRODUCTS')) {
      const id = Number(params[params.length - 1]);
      const prod = store.products.find((p) => p.id === id);
      if (prod) {
        if (sqlUpper.includes('CURRENT_STOCK = CURRENT_STOCK -')) {
          prod.current_stock -= Number(params[0]);
        } else if (sqlUpper.includes('CURRENT_STOCK = CURRENT_STOCK +')) {
          prod.current_stock += Number(params[0]);
        } else if (sqlUpper.includes('CURRENT_STOCK = $1')) {
          prod.current_stock = Number(params[0]);
        } else {
          if (params[0] !== null && params[0] !== undefined) prod.product_name = params[0];
          if (params[1] !== null && params[1] !== undefined) prod.sku = String(params[1]).toUpperCase();
          if (params[2] !== null && params[2] !== undefined) prod.category = params[2];
          if (params[3] !== null && params[3] !== undefined) prod.unit_price = Number(params[3]);
          if (params[4] !== null && params[4] !== undefined) prod.current_stock = Number(params[4]);
          if (params[5] !== null && params[5] !== undefined) prod.minimum_stock = Number(params[5]);
          if (params[6] !== null && params[6] !== undefined) prod.warehouse_location = params[6];
        }
        prod.updated_at = new Date().toISOString();
      }
      saveStore(store);
      return { rows: prod ? [prod] : [], rowCount: prod ? 1 : 0 };
    }
  }

  // Stock Movements Queries
  if (sqlUpper.includes('STOCK_MOVEMENTS')) {
    if (sqlUpper.startsWith('INSERT INTO STOCK_MOVEMENTS')) {
      const newSm = {
        id: store.stock_movements.length + 1,
        product_id: Number(params[0]),
        quantity: Number(params[1]),
        movement_type: params[2],
        reason: params[3] || null,
        created_by: params[4] || null,
        created_at: new Date().toISOString(),
      };
      store.stock_movements.push(newSm);
      saveStore(store);
      return { rows: [newSm], rowCount: 1 };
    }
    if (sqlUpper.startsWith('SELECT')) {
      const joined = store.stock_movements.map((sm) => {
        const prod = store.products.find((p) => p.id === sm.product_id);
        const user = store.users.find((u) => u.id === sm.created_by);
        return {
          ...sm,
          product_name: prod ? prod.product_name : `Product #${sm.product_id}`,
          sku: prod ? prod.sku : 'N/A',
          created_by_name: user ? user.name : 'System',
        };
      }).reverse();
      const limit = Number(params[params.length - 1]) || 50;
      const sliced = joined.slice(0, limit);
      return { rows: sliced, rowCount: sliced.length };
    }
  }

  // Challans Queries
  if (sqlUpper.includes('CHALLANS') || sqlUpper.includes('CHALLAN_ITEMS')) {
    if (sqlUpper.includes('COUNT(*)') && sqlUpper.includes('DRAFT_CHALLANS')) {
      const totalChallans = store.challans.length;
      const draftChallans = store.challans.filter((c) => c.status === 'DRAFT').length;
      const confirmedChallans = store.challans.filter((c) => c.status === 'CONFIRMED').length;
      return { rows: [{ total_challans: totalChallans, draft_challans: draftChallans, confirmed_challans: confirmedChallans }], rowCount: 1 };
    }
    if (sqlUpper.startsWith('SELECT COUNT(*)')) {
      return { rows: [{ count: store.challans.length }], rowCount: 1 };
    }
    if (sqlUpper.startsWith('INSERT INTO CHALLANS')) {
      const newCh = {
        id: store.challans.length + 1,
        challan_number: params[0],
        customer_id: Number(params[1]),
        total_quantity: Number(params[2]),
        status: 'DRAFT',
        created_by: params[3] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.challans.push(newCh);
      saveStore(store);
      return { rows: [newCh], rowCount: 1 };
    }
    if (sqlUpper.startsWith('INSERT INTO CHALLAN_ITEMS')) {
      const newItem = {
        id: store.challan_items.length + 1,
        challan_id: Number(params[0]),
        product_id: Number(params[1]),
        product_name_snapshot: params[2],
        sku_snapshot: params[3],
        unit_price_snapshot: Number(params[4]),
        quantity: Number(params[5]),
        subtotal: Number(params[6]),
      };
      store.challan_items.push(newItem);
      saveStore(store);
      return { rows: [newItem], rowCount: 1 };
    }
    if (sqlUpper.startsWith('UPDATE CHALLANS')) {
      const id = Number(params[params.length - 1]);
      const ch = store.challans.find((c) => c.id === id);
      if (ch) {
        if (params[0]) ch.status = params[0];
        ch.updated_at = new Date().toISOString();
      }
      saveStore(store);
      return { rows: ch ? [ch] : [], rowCount: ch ? 1 : 0 };
    }
    if (sqlUpper.includes('FROM CHALLAN_ITEMS WHERE CHALLAN_ID =')) {
      const challanId = Number(params[0]);
      const items = store.challan_items.filter((i) => i.challan_id === challanId);
      return { rows: items, rowCount: items.length };
    }
    if (sqlUpper.startsWith('SELECT')) {
      if (sqlUpper.includes('WHERE CH.ID =')) {
        const id = Number(params[0]);
        const ch = store.challans.find((c) => c.id === id);
        if (!ch) return { rows: [], rowCount: 0 };
        const cust = store.customers.find((c) => c.id === ch.customer_id);
        const user = store.users.find((u) => u.id === ch.created_by);
        const joined = {
          ...ch,
          customer_name: cust ? cust.customer_name : 'Unknown Customer',
          customer_mobile: cust ? cust.mobile : '',
          customer_email: cust ? cust.email : '',
          customer_address: cust ? cust.address : '',
          created_by_name: user ? user.name : 'System',
        };
        return { rows: [joined], rowCount: 1 };
      }
      const joined = store.challans.map((ch) => {
        const cust = store.customers.find((c) => c.id === ch.customer_id);
        const user = store.users.find((u) => u.id === ch.created_by);
        return {
          ...ch,
          customer_name: cust ? cust.customer_name : 'Unknown Customer',
          created_by_name: user ? user.name : 'System',
        };
      }).reverse();
      const limit = Number(params[params.length - 1]) || 10;
      const sliced = joined.slice(0, limit);
      return { rows: sliced, rowCount: sliced.length };
    }
  }

  return { rows: [], rowCount: 0 };
}

// Transaction Pool compatibility interface
export const pool = {
  connect: async () => {
    if (dbMode === 'postgres' && pgPool) {
      return pgPool.connect();
    }
    return {
      query: (text: string, params: any[] = []) => query(text, params),
      release: () => {},
    };
  },
  query: (text: string, params: any[] = []) => query(text, params),
};
