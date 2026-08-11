export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: number;
  customer_name: string;
  mobile: string;
  email?: string;
  business_name?: string;
  gst_number?: string;
  customer_type: CustomerType;
  address?: string;
  status: CustomerStatus;
  follow_up_date?: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  product_name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location?: string;
  created_at: string;
  updated_at: string;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: number;
  product_id: number;
  quantity: number;
  movement_type: MovementType;
  reason?: string;
  created_by?: number;
  created_at: string;
  product_name?: string;
  sku?: string;
  created_by_name?: string;
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: number;
  challan_id: number;
  product_id: number;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  subtotal: number;
}

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  total_quantity: number;
  status: ChallanStatus;
  created_by?: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_mobile?: string;
  customer_email?: string;
  customer_address?: string;
  created_by_name?: string;
  items?: ChallanItem[];
}

export interface DashboardStats {
  metrics: {
    totalCustomers: number;
    totalProducts: number;
    totalStockUnits: number;
    lowStockCount: number;
    totalChallans: number;
    draftChallans: number;
    confirmedChallans: number;
  };
  recentChallans: Challan[];
  lowStockProducts: Product[];
  recentMovements: StockMovement[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
