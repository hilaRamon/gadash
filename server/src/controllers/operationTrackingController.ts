import type { Request, Response } from 'express';
import { operationTrackingService } from '../services/operationTrackingService';
import { asyncHandler } from '../utils/asyncHandler';
import { prepareEmployeeTrackingBody } from '../utils/employeeAuth';

export const operationTrackingController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await operationTrackingService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = prepareEmployeeTrackingBody(req.auth, req.body);
    const data = await operationTrackingService.create(body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await operationTrackingService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const adminOverride =
      req.body?.adminOverride === true || req.body?.adminOverride === 'true';
    await operationTrackingService.remove(req.params.id, adminOverride);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    const adminOverride =
      req.body?.adminOverride === true || req.body?.adminOverride === 'true';
    await operationTrackingService.removeMany(ids, adminOverride);
    res.status(204).send();
  }),
};
