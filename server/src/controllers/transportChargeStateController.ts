import type { Request, Response } from 'express';
import { transportChargeStateService } from '../services/transportChargeStateService';
import { asyncHandler } from '../utils/asyncHandler';

export const transportChargeStateController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    const data = await transportChargeStateService.get();
    res.json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await transportChargeStateService.updatePeriodStartDate(
      req.body?.periodStartDate,
    );
    res.json(data);
  }),
};
