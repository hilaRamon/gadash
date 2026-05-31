import type { Request, Response } from 'express';
import { plotService } from '../services/plotService';
import { asyncHandler } from '../utils/asyncHandler';

export const plotController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await plotService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await plotService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await plotService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await plotService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await plotService.removeMany(ids);
    res.status(204).send();
  }),
};
