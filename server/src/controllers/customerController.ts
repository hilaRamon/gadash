import type { Request, Response } from 'express';
import { customerService } from '../services/customerService';
import { asyncHandler } from '../utils/asyncHandler';

export const customerController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await customerService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await customerService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await customerService.removeMany(ids);
    res.status(204).send();
  }),
};
