# Mini ERP + CRM Operations Portal

A production-ready, full-stack **Mini ERP + CRM Operations Portal** built for enterprise sales tracking, inventory management, customer relationship management (CRM), and transactional sales challan dispatching.

---

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, HTML5, Vanilla CSS Design System, React Router v6, Vite
- **Backend**: Node.js, Express.js, TypeScript, REST API, JWT Authentication, bcryptjs
- **Database**: PostgreSQL (Native `pg` pool, Neon PostgreSQL ready)
- **Deployment Platform**:
  - Frontend → **Vercel**
  - Backend → **Render**
  - Database → **Neon PostgreSQL**

---

## 🏛️ Architecture & System Design

```
[ Vercel Single-Page React App ] 
             │
             ▼ REST API (JWT Authenticated)
[ Render Node.js / Express TypeScript API Server ]
             │
             ▼ Transaction-Safe Pool
[ Neon Cloud PostgreSQL Database ]
```

### Business Workflow & Logic
1. **Admin / Roles**: Role-Based Access Control (RBAC) enforced via JWT middleware (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).
2. **Sales / CRM**: Customer onboarding, lead-to-active status tracking, and scheduled follow-up dates.
3. **Warehouse / Inventory**: Real-time product inventory tracking, warehouse location mapping, low-stock threshold alerting (`current_stock <= minimum_stock`), and manual stock movements.
4. **Sales Challan Dispatching (Atomic Stock Deduction)**:
   - Creating a **DRAFT** challan records line item snapshots (`product_name_snapshot`, `sku_snapshot`, `unit_price_snapshot`) without reducing product inventory.
   - **Confirming** a challan executes an **atomic database transaction** (`BEGIN ... COMMIT`):
     1. Locks candidate products with `FOR UPDATE`.
     2. Verifies stock availability for every requested line item.
     3. Rejects with `HTTP 400 Insufficient Stock` if any item exceeds available stock (preventing negative inventory).
     4. Atomically reduces `current_stock` for all products and creates audit log records (`stock_movements` with type `OUT`).
     5. Updates challan status to `CONFIRMED`.

---

## 📁 Project Structure

```
crm/
├── frontend/                     # React + TypeScript + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                  # Centralized API service layer (client, auth, customer, product, challan, etc.)
│   │   ├── components/           # UI & Layout components (Sidebar, Header, StatCard, StatusBadge, Modal)
│   │   ├── context/              # AuthContext (JWT management & RBAC helpers)
│   │   ├── pages/                # Dashboard, Customers, CustomerDetail, Products, StockMovements, Challans, CreateChallan, Users
│   │   ├── styles/               # Global CSS design system & CSS variables
│   │   ├── types/                # TypeScript interfaces
│   │   ├── App.tsx               # Application Router
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/               # DB connection pool (Neon PostgreSQL support)
│   │   ├── controllers/          # Express route handlers
│   │   ├── db/                   # DDL Schema & Auto-Seeding script
│   │   ├── middleware/           # authMiddleware & authorizeRoles middleware
│   │   ├── repositories/         # PostgreSQL query repositories
│   │   ├── routes/               # REST API Router declarations
│   │   ├── types/                # Express & domain types
│   │   ├── utils/                # JWT and password hashing utilities
│   │   └── server.ts             # Express server entrypoint & Health Check
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
└── .gitignore
```

---

## 🔑 Test Credentials

The database auto-seeds test accounts upon initial launch (all passwords set to `Password123!`):

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **ADMIN** | `admin@erp.com` | `Password123!` | Full system access + User Management |
| **SALES** | `sales@erp.com` | `Password123!` | Customer CRM & Sales Challan creation/confirmation |
| **WAREHOUSE** | `warehouse@erp.com` | `Password123!` | Product Catalog, Stock Intake/Adjustment, Challan Confirmation |
| **ACCOUNTS** | `accounts@erp.com` | `Password123!` | Read-only access to CRM, Inventory, & Financial Challans |

---

## 🛠️ Environment Variables

### Backend `.env`
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgres://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=super_secret_jwt_key_mini_erp_crm_2026
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend `.env`
```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

---

## 💻 Local Setup & Development

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL instance or a free Neon.tech database URL

### 1. Backend Setup
```bash
cd backend
npm install

# Option A: Connect to Neon or local Postgres
# Create .env file based on .env.example
cp .env.example .env

# Initialize Schema & Seed Test Data
npm run db:init

# Run Backend in Development Mode
npm run dev
```
Backend API will be running at `http://localhost:5000/api` with health check at `http://localhost:5000/api/health`.

### 2. Frontend Setup
```bash
cd frontend
npm install

# Run Frontend Development Server
npm run dev
```
Frontend will be running at `http://localhost:5173`.

---

## 📡 REST API Documentation

### Health & Auth
- `GET /api/health` — System status check
- `POST /api/auth/login` — User login (Returns JWT token + user info)
- `GET /api/auth/me` — Retrieve logged-in user profile

### Customer CRM
- `GET /api/customers` — Get customers (supports `search`, `status`, `customer_type`, `page`, `limit`)
- `GET /api/customers/:id` — Get customer details
- `POST /api/customers` — Create new customer
- `PUT /api/customers/:id` — Update customer details / follow-up notes
- `DELETE /api/customers/:id` — Delete customer (Admin only)

### Product & Inventory
- `GET /api/products` — Get product catalog (supports `search`, `category`, `lowStock`, `page`, `limit`)
- `GET /api/products/:id` — Get single product
- `POST /api/products` — Create product
- `PUT /api/products/:id` — Update product details
- `DELETE /api/products/:id` — Delete product (Admin only)
- `GET /api/products/:id/movements` — Product stock movement audit log

### Stock Movements
- `POST /api/stock/movement` — Manual stock movement (`IN` or `OUT` with stock validation)
- `GET /api/stock/movements` — Full inventory audit trail

### Sales Challans
- `GET /api/challans` — Get list of challans (supports `search`, `status`, `page`, `limit`)
- `GET /api/challans/:id` — Get challan with snapshot items
- `POST /api/challans` — Create draft sales challan
- `POST /api/challans/:id/confirm` — **Confirm challan (Atomic DB Transaction & stock reduction)**
- `POST /api/challans/:id/cancel` — Cancel challan (Restores stock if previously confirmed)

### Dashboard & Users
- `GET /api/dashboard/stats` — Executive dashboard metrics & recent activities
- `GET /api/users` — Get portal users (Admin only)
- `POST /api/users` — Create portal user (Admin only)

---

## 🌐 Deployment Instructions

### 1. Database Deployment (Neon)
1. Create a project on [Neon.tech](https://neon.tech).
2. Copy the Connection String (`postgres://...`).
3. Set `DATABASE_URL` in your backend environment variables.
4. Run `npm run db:init` from the backend directory to create tables & seed test users.

### 2. Backend Deployment (Render)
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository and set Root Directory to `backend`.
3. Set Environment to `Node`.
4. Build Command: `npm install && npm run build`
5. Start Command: `npm run start`
6. Add Environment Variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://<your-vercel-app>.vercel.app`

### 3. Frontend Deployment (Vercel)
1. Import your GitHub repository on [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add Environment Variable:
   - `VITE_API_URL=https://<your-render-backend>.onrender.com/api`

---

## 📝 Known Limitations
- Payment Gateway integration is out of scope for this Mini ERP release (Invoicing & dispatch totals are calculated via item snapshots).
- Real-time WebSockets are not used; views poll or update on state actions.
