import { Request, Response } from 'express';
import { UserRepository } from '../repositories/userRepo';
import { hashPassword } from '../utils/password';
import { sendError, sendSuccess } from '../utils/response';

const userRepo = new UserRepository();

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await userRepo.getAll();
    return sendSuccess(res, users);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch users', 500);
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return sendError(res, 'Name, email, password, and role are required', 400);
    }

    if (!['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'].includes(role)) {
      return sendError(res, 'Invalid role. Allowed roles: ADMIN, SALES, WAREHOUSE, ACCOUNTS', 400);
    }

    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return sendError(res, 'User with this email already exists', 409);
    }

    const password_hash = await hashPassword(password);
    const newUser = await userRepo.create({ name, email, password_hash, role });

    return sendSuccess(res, newUser, 'User created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create user', 500);
  }
}
