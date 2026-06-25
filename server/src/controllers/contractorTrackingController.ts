import type { Request, Response } from 'express';
import { contractorTrackingService } from '../services/contractorTrackingService';
import { asyncHandler } from '../utils/asyncHandler';
import { parseSeasonQuery } from '../utils/seasonRange';

export const contractorTrackingController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const seasonYear = parseSeasonQuery(req.query);
    const data = await contractorTrackingService.list(seasonYear);
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await contractorTrackingService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await contractorTrackingService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await contractorTrackingService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await contractorTrackingService.removeMany(ids);
    res.status(204).send();
  }),
};
