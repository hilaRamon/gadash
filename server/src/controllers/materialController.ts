import type { Request, Response } from 'express';
import { materialService } from '../services/materialService';
import { asyncHandler } from '../utils/asyncHandler';

export const materialController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await materialService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await materialService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await materialService.update(req.params.id, req.body);
    res.json(data);
  }),

  appendPricingChange: asyncHandler(async (req: Request, res: Response) => {
    const data = await materialService.appendPricingChange(req.params.id, req.body);
    res.status(201).json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await materialService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await materialService.removeMany(ids);
    res.status(204).send();
  }),
};
