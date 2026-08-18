import type { Request, Response } from 'express';
import { invoiceService } from '../services/invoiceService';
import { asyncHandler } from '../utils/asyncHandler';
import { respondToListRequest } from '../utils/listResponse';

export const invoiceController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    await respondToListRequest(
      req,
      res,
      () => invoiceService.list(),
      (listQuery) => invoiceService.listPaginated(listQuery),
    );
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await invoiceService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await invoiceService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await invoiceService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await invoiceService.removeMany(ids);
    res.status(204).send();
  }),
};
