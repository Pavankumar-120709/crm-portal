import { Request, Response } from 'express';
import { UserRepository } from '../repositories/userRepo';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendError, sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

const userRepo = new UserRepository();

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await userRepo.findByEmail(email);
    if (!user || !user.password_hash) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return sendSuccess(res, { token, user: userObj }, 'Login successful');
  } catch (error: any) {
    return sendError(res, error.message || 'Login failed', 500);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch user', 500);
  }
}
