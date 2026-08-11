import { Request } from 'express';

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

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
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: number;
  product_id: number;
  quantity: number;
  movement_type: MovementType;
  reason?: string;
  created_by?: number;
  created_at: Date;
  product_name?: string;
  sku?: string;
  created_by_name?: string;
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItemInput {
  product_id: number;
  quantity: number;
}

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
  created_at: Date;
  updated_at: Date;
  customer_name?: string;
  created_by_name?: string;
  items?: ChallanItem[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
