import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_mini_erp_crm_2026';
const EXPIRES_IN = '24h';

export function generateToken(payload: { id: number; email: string; role: UserRole }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
