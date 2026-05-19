import { Router } from 'express';
import { customerController } from '../controllers/customerController';

export const customerRouter = Router();

customerRouter.get('/', customerController.list);
customerRouter.post('/', customerController.create);
customerRouter.post('/bulk-delete', customerController.bulkRemove);
customerRouter.put('/:id', customerController.update);
customerRouter.delete('/:id', customerController.remove);
