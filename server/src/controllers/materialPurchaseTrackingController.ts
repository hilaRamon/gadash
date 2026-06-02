import type { Request, Response } from 'express';
import { materialPurchaseTrackingService } from '../services/materialPurchaseTrackingService';
import { asyncHandler } from '../utils/asyncHandler';

export const materialPurchaseTrackingController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await materialPurchaseTrackingService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await materialPurchaseTrackingService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await materialPurchaseTrackingService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await materialPurchaseTrackingService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await materialPurchaseTrackingService.removeMany(ids);
    res.status(204).send();
  }),
};
