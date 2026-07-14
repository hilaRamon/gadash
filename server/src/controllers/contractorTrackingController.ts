import type { Request, Response } from 'express';
import { contractorTrackingService } from '../services/contractorTrackingService';
import { asyncHandler } from '../utils/asyncHandler';
import { respondToListRequest } from '../utils/listResponse';
import { parseSeasonQuery } from '../utils/seasonRange';

export const contractorTrackingController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const seasonYear = parseSeasonQuery(req.query as Record<string, unknown>);
    await respondToListRequest(
      req,
      res,
      () => contractorTrackingService.list(seasonYear),
      (listQuery) => contractorTrackingService.listPaginated({
        ...listQuery,
        season: listQuery.season ?? seasonYear,
      }),
    );
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
