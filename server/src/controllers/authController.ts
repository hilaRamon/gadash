import type { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';

export const authController = {
  loginOptions: asyncHandler(async (_req: Request, res: Response) => {
    const data = await authService.listLoginOptions();
    res.json(data);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = String(req.body?.employeeId ?? '').trim();
    const mobile = String(req.body?.mobile ?? '');

    if (!employeeId) {
      throw new HttpError(400, 'יש לבחור שם עובד');
    }

    const data = await authService.login(employeeId, mobile);
    res.json(data);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) {
      throw new HttpError(401, 'נדרשת התחברות');
    }

    res.json(authService.getCurrentUser(req.auth));
  }),
};
