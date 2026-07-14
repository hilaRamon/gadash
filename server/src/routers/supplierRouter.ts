import { Router } from 'express';
import { supplierController } from '../controllers/supplierController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const supplierRouter = Router();

supplierRouter.get('/', parseListQuery, supplierController.list);
supplierRouter.post('/', supplierController.create);
supplierRouter.post('/bulk-delete', supplierController.bulkRemove);
supplierRouter.put('/:id', supplierController.update);
supplierRouter.delete('/:id', supplierController.remove);
