import type { Request, Response } from 'express';
import { employeeService } from '../services/employeeService';
import { asyncHandler } from '../utils/asyncHandler';

export const employeeController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await employeeService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await employeeService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await employeeService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await employeeService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await employeeService.removeMany(ids);
    res.status(204).send();
  }),
};
