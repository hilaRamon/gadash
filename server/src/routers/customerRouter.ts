import { Router } from 'express';
import { customerController } from '../controllers/customerController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const customerRouter = Router();

customerRouter.get('/', parseListQuery, customerController.list);
customerRouter.post('/', customerController.create);
customerRouter.post('/bulk-delete', customerController.bulkRemove);
customerRouter.put('/:id', customerController.update);
customerRouter.delete('/:id', customerController.remove);
