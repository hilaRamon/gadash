import type { Request, Response } from 'express';
import { customerBillingTrackingService } from '../services/customerBillingTrackingService';
import { asyncHandler } from '../utils/asyncHandler';

export const customerBillingTrackingController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await customerBillingTrackingService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerBillingTrackingService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerBillingTrackingService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await customerBillingTrackingService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await customerBillingTrackingService.removeMany(ids);
    res.status(204).send();
  }),
};
