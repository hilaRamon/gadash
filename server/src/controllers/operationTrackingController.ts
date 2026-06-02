import type { Request, Response } from 'express';
import { operationTrackingService } from '../services/operationTrackingService';
import { asyncHandler } from '../utils/asyncHandler';

export const operationTrackingController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await operationTrackingService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await operationTrackingService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await operationTrackingService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await operationTrackingService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await operationTrackingService.removeMany(ids);
    res.status(204).send();
  }),
};
