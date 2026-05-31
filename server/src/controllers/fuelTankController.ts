import type { Request, Response } from 'express';
import { fuelTankService } from '../services/fuelTankService';
import { asyncHandler } from '../utils/asyncHandler';

export const fuelTankController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await fuelTankService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await fuelTankService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await fuelTankService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await fuelTankService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await fuelTankService.removeMany(ids);
    res.status(204).send();
  }),
};
