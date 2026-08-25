import type { Request, Response } from 'express';
import multer from 'multer';
import { invoiceService } from '../services/invoiceService';
import { asyncHandler } from '../utils/asyncHandler';
import { respondToListRequest } from '../utils/listResponse';
import { HttpError } from '../utils/httpError';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const invoiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, 'סוג קובץ לא נתמך. מותר: PDF, JPEG, PNG, WebP'));
    }
  },
});

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

  monthlySummary: asyncHandler(async (req: Request, res: Response) => {
    const data = await invoiceService.monthlySummary(String(req.query.month ?? ''));
    res.json(data);
  }),

  uploadFile: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      throw new HttpError(400, 'קובץ לא נמצא בבקשה');
    }
    const data = await invoiceService.attachFile(req.params.id, {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });
    res.json(data);
  }),

  streamFile: asyncHandler(async (req: Request, res: Response) => {
    const { body, contentType, contentLength, fileName } =
      await invoiceService.getFile(req.params.id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    if (contentLength != null) {
      res.setHeader('Content-Length', contentLength);
    }
    body.pipe(res);
  }),

  deleteFile: asyncHandler(async (req: Request, res: Response) => {
    await invoiceService.detachFile(req.params.id);
    res.status(204).send();
  }),
};
