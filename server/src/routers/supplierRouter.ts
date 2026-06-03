import { Router } from 'express';
import { supplierController } from '../controllers/supplierController';

export const supplierRouter = Router();

supplierRouter.get('/', supplierController.list);
supplierRouter.post('/', supplierController.create);
supplierRouter.post('/bulk-delete', supplierController.bulkRemove);
supplierRouter.put('/:id', supplierController.update);
supplierRouter.delete('/:id', supplierController.remove);
