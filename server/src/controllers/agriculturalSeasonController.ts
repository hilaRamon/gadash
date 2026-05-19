import type { Request, Response } from 'express';
import { agriculturalSeasonService } from '../services/agriculturalSeasonService';
import { asyncHandler } from '../utils/asyncHandler';

export const agriculturalSeasonController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await agriculturalSeasonService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await agriculturalSeasonService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await agriculturalSeasonService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await agriculturalSeasonService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await agriculturalSeasonService.removeMany(ids);
    res.status(204).send();
  }),
};
