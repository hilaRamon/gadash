import type { Request, Response } from 'express';
import { transportTrackingService } from '../services/transportTrackingService';
import { asyncHandler } from '../utils/asyncHandler';

export const transportTrackingController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await transportTrackingService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await transportTrackingService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await transportTrackingService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await transportTrackingService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await transportTrackingService.removeMany(ids);
    res.status(204).send();
  }),
};
