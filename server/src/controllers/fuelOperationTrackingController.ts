import type { Request, Response } from 'express';
import { fuelOperationTrackingService } from '../services/fuelOperationTrackingService';
import { asyncHandler } from '../utils/asyncHandler';

export const fuelOperationTrackingController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await fuelOperationTrackingService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await fuelOperationTrackingService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await fuelOperationTrackingService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await fuelOperationTrackingService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await fuelOperationTrackingService.removeMany(ids);
    res.status(204).send();
  }),
};
