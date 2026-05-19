import type { Request, Response } from 'express';
import { operationService } from '../services/operationService';
import { asyncHandler } from '../utils/asyncHandler';

export const operationController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await operationService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await operationService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await operationService.update(req.params.id, req.body);
    res.json(data);
  }),

  appendCostChange: asyncHandler(async (req: Request, res: Response) => {
    const data = await operationService.appendCostChange(req.params.id, req.body);
    res.status(201).json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await operationService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await operationService.removeMany(ids);
    res.status(204).send();
  }),
};
