import type { Request, Response } from 'express';
import { customerBillService } from '../services/customerBillService';
import { customerBillingUnbilledService } from '../services/customerBillingUnbilledService';
import { customerBillingTrackingService } from '../services/customerBillingTrackingService';
import { asyncHandler } from '../utils/asyncHandler';
import { attachmentContentDisposition } from '../utils/contentDisposition';
import { buildCustomerBillDownloadFilename } from '../utils/customerBillFilename';

export const customerBillingTrackingController = {
  listCustomersWithUnbilled: asyncHandler(async (_req: Request, res: Response) => {
    const data = await customerBillingUnbilledService.listCustomersWithUnbilled();
    res.json(data);
  }),

  unbilledPreview: asyncHandler(async (req: Request, res: Response) => {
    const customerId = String(req.query.customerId ?? '');
    const data = await customerBillingUnbilledService.getUnbilledPreview(customerId);
    res.json(data);
  }),

  billPreview: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerBillService.getBillPreview(req.body);
    res.json(data);
  }),

  billPdf: asyncHandler(async (req: Request, res: Response) => {
    const pdf = await customerBillService.getBillPdf(req.body);
    const customerName = String(req.body?.customerName ?? '').trim() || 'לקוח';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      attachmentContentDisposition(buildCustomerBillDownloadFilename(customerName)),
    );
    res.send(pdf);
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    const data = await customerBillingTrackingService.list();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerBillingTrackingService.create(req.body);
    res.status(201).json(data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerBillingTrackingService.update(req.params.id, req.body);
    res.json(data);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await customerBillingTrackingService.remove(req.params.id);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    await customerBillingTrackingService.removeMany(ids);
    res.status(204).send();
  }),
};
