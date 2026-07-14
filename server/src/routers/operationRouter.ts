import { Router } from 'express';
import { operationController } from '../controllers/operationController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const operationRouter = Router();

operationRouter.get('/', parseListQuery, operationController.list);
operationRouter.post('/', operationController.create);
operationRouter.post('/bulk-delete', operationController.bulkRemove);
operationRouter.post('/:id/cost-changes', operationController.appendCostChange);
operationRouter.put('/:id', operationController.update);
operationRouter.delete('/:id', operationController.remove);
