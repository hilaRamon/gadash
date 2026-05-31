import type { Request, Response } from 'express';
import { baleService } from '../services/baleService';
import { asyncHandler } from '../utils/asyncHandler';

export const baleController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await baleService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await baleService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await baleService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await baleService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await baleService.removeMany(ids);
    res.status(204).send();
  }),
};
