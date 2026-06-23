import type { Request, Response } from 'express';
import { materialUsageTrackingService } from '../services/materialUsageTrackingService';
import { asyncHandler } from '../utils/asyncHandler';
import { prepareEmployeeTrackingBody } from '../utils/employeeAuth';

export const materialUsageTrackingController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await materialUsageTrackingService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = prepareEmployeeTrackingBody(req.auth, req.body);
    const data = await materialUsageTrackingService.create(body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await materialUsageTrackingService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await materialUsageTrackingService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await materialUsageTrackingService.removeMany(ids);
    res.status(204).send();
  }),
};
