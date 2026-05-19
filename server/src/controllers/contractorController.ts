import type { Request, Response } from 'express';
import { contractorService } from '../services/contractorService';
import { asyncHandler } from '../utils/asyncHandler';

export const contractorController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await contractorService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await contractorService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await contractorService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await contractorService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await contractorService.removeMany(ids);
    res.status(204).send();
  }),
};
