import { query } from '../config/db';
import { User, UserRole } from '../types';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const res = await query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async getAll(): Promise<User[]> {
    const res = await query('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC');
    return res.rows;
  }

  async create(user: { name: string; email: string; password_hash: string; role: UserRole }): Promise<User> {
    const res = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, LOWER($2), $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [user.name, user.email, user.password_hash, user.role]
    );
    return res.rows[0];
  }
}
