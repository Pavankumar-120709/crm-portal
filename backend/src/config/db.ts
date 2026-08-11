import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const rawConnectionString = process.env.DATABASE_URL || '';

// Check if DATABASE_URL is set and is NOT a dummy placeholder
const isPlaceholderUrl =
  !rawConnectionString ||
  rawConnectionString.includes('ep-sample-123456') ||
  rawConnectionString.includes('user:password@');

export let dbMode: 'postgres' | 'sqlite' | 'json' = 'json';

let pgPool: Pool | null = null;
let sqliteDb: any = null;

// Dynamically check if sqlite3 is installed and loadable
let sqlite3Module: any = null;
try {
  sqlite3Module = require('sqlite3');
} catch (e) {
  // sqlite3 module not compiled/available, will fallback to JSON store
}

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
} else if (sqlite3Module) {
  dbMode = 'sqlite';
  const dbPath = path.join(__dirname, '../../mini_erp.db');
  sqliteDb = new sqlite3Module.Database(dbPath);
} else {
  dbMode = 'json';
  console.log('ℹ️ Local development mode: Using embedded JSON file store (dev_storage.json)');
}

export const isPostgres = dbMode === 'postgres';

// --- Embedded JSON File Store Implementation ---
const jsonFilePath = path.join(__dirname, '../../dev_storage.json');

interface LocalStorage {
  users: any[];
  customers: any[];
  products: any[];
  stock_movements: any[];
  challans: any[];
  challan_items: any[];
}

function loadStore(): LocalStorage {
  if (fs.existsSync(jsonFilePath)) {
    try {
      const data = fs.readFileSync(jsonFilePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {}
  }
  return { users: [], customers: [], products: [], stock_movements: [], challans: [], challan_items: [] };
}

function saveStore(data: LocalStorage) {
  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// Transform Postgres SQL parameters ($1, $2) to SQLite (?)
function transformSqlForSqlite(sql: string): { sql: string } {
  let transformed = sql;
  transformed = transformed.replace(/\bILIKE\b/g, 'LIKE');
  transformed = transformed.replace(/\bFOR UPDATE\b/gi, '');
  transformed = transformed.replace(/\$\d+/g, '?');
  return { sql: transformed };
}

// Unified Query Handler
export async function query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  // 1. PostgreSQL Engine
  if (dbMode === 'postgres' && pgPool) {
    try {
      const res = await pgPool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
    } catch (err: any) {
      if (err.code === '28P01' || err.message?.includes('password authentication failed') || err.message?.includes('ECONNREFUSED')) {
        console.warn(`⚠️ PostgreSQL connection failed (${err.message}). Falling back to local embedded store...`);
        dbMode = sqlite3Module ? 'sqlite' : 'json';
        return query(text, params);
      }
      throw err;
    }
  }

  // 2. SQLite Engine
  if (dbMode === 'sqlite' && sqliteDb) {
    const { sql: sqliteSql } = transformSqlForSqlite(text);
    const trimmed = sqliteSql.trim();
    const isSelect = /^SELECT/i.test(trimmed);
    const isInsert = /^INSERT/i.test(trimmed);
    const isUpdate = /^UPDATE/i.test(trimmed);
    const isDelete = /^DELETE/i.test(trimmed);

    return new Promise((resolve, reject) => {
      if (isSelect) {
        sqliteDb.all(sqliteSql, params, (err: any, rows: any[]) => {
          if (err) return reject(err);
          resolve({ rows: rows || [], rowCount: (rows || []).length });
        });
      } else if (isInsert) {
        sqliteDb.run(sqliteSql, params, function (this: any, err: any) {
          if (err) return reject(err);
          const lastId = this.lastID;
          const matchTable = sqliteSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
          if (matchTable && /RETURNING/i.test(text)) {
            const tableName = matchTable[1];
            sqliteDb.get(`SELECT * FROM ${tableName} WHERE id = ?`, [lastId], (err2: any, row: any) => {
              if (err2 || !row) {
                sqliteDb.get(`SELECT * FROM ${tableName} WHERE rowid = ?`, [lastId], (err3: any, rowIdRow: any) => {
                  resolve({ rows: rowIdRow ? [rowIdRow] : [{ id: lastId }], rowCount: 1 });
                });
              } else {
                resolve({ rows: [row], rowCount: 1 });
              }
            });
          } else {
            resolve({ rows: [{ id: lastId }], rowCount: 1 });
          }
        });
      } else if (isUpdate) {
        sqliteDb.run(sqliteSql, params, function (this: any, err: any) {
          if (err) return reject(err);
          const changes = this.changes;
          const matchTable = sqliteSql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
          const idVal = params[params.length - 1];
          if (matchTable && /RETURNING/i.test(text) && idVal !== undefined) {
            const tableName = matchTable[1];
            sqliteDb.get(`SELECT * FROM ${tableName} WHERE id = ?`, [idVal], (err2: any, row: any) => {
              resolve({ rows: row ? [row] : [], rowCount: changes });
            });
          } else {
            resolve({ rows: [], rowCount: changes });
          }
        });
      } else if (isDelete) {
        sqliteDb.run(sqliteSql, params, function (this: any, err: any) {
          if (err) return reject(err);
          resolve({ rows: [], rowCount: this.changes });
        });
      } else {
        sqliteDb.exec(sqliteSql, (err: any) => {
          if (err) return reject(err);
          resolve({ rows: [], rowCount: 0 });
        });
      }
    });
  }

  // 3. Embedded JSON File Storage Engine (Zero Dependency Fallback)
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
      // Apply pagination if params has limit/offset
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
