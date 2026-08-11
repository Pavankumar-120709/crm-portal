import { Response } from 'express';

export function sendSuccess<T>(res: Response, data?: T, message?: string, statusCode: number = 200, pagination?: any) {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
    ...(pagination ? { pagination } : {}),
  });
}

export function sendError(res: Response, message: string, statusCode: number = 400, details?: any) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
