import type { Request, Response } from 'express';
import { tractorService } from '../services/tractorService';
import { asyncHandler } from '../utils/asyncHandler';

export const tractorController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await tractorService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await tractorService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await tractorService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await tractorService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await tractorService.removeMany(ids);
    res.status(204).send();
  }),
};
