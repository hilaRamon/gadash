import type { NextFunction, Request, Response } from 'express';
import { EMPLOYEE_ROLE_ADMIN } from '../models/Employee';
import type { AuthUser } from '../types/auth';
import { HttpError } from '../utils/httpError';
import { verifyAuthToken } from '../utils/jwt';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'נדרשת התחברות'));
    return;
  }

  try {
    req.auth = verifyAuthToken(header.slice(7));
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.auth) {
    next(new HttpError(401, 'נדרשת התחברות'));
    return;
  }

  if (req.auth.role !== EMPLOYEE_ROLE_ADMIN) {
    next(new HttpError(403, 'אין הרשאה'));
    return;
  }

  next();
}

export function requireAdminForWrite(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!WRITE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  requireAdmin(req, _res, next);
}

