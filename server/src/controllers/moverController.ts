import type { Request, Response } from 'express';
import { moverService } from '../services/moverService';
import { asyncHandler } from '../utils/asyncHandler';

export const moverController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await moverService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await moverService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await moverService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await moverService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await moverService.removeMany(ids);
    res.status(204).send();
  }),
};
