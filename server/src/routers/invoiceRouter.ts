import { Router } from 'express';
import { invoiceController, invoiceUpload } from '../controllers/invoiceController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const invoiceRouter = Router();

invoiceRouter.get('/', parseListQuery, invoiceController.list);
invoiceRouter.get('/monthly-summary', invoiceController.monthlySummary);
invoiceRouter.post('/', invoiceController.create);
invoiceRouter.post('/bulk-delete', invoiceController.bulkRemove);
invoiceRouter.put('/:id', invoiceController.update);
invoiceRouter.delete('/:id', invoiceController.remove);

invoiceRouter.post('/:id/file', invoiceUpload.single('file'), invoiceController.uploadFile);
invoiceRouter.get('/:id/file', invoiceController.streamFile);
invoiceRouter.delete('/:id/file', invoiceController.deleteFile);
