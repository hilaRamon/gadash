import { Router } from 'express';
import { operationController } from '../controllers/operationController';

export const operationRouter = Router();

operationRouter.get('/', operationController.list);
operationRouter.post('/', operationController.create);
operationRouter.post('/bulk-delete', operationController.bulkRemove);
operationRouter.post('/:id/cost-changes', operationController.appendCostChange);
operationRouter.put('/:id', operationController.update);
operationRouter.delete('/:id', operationController.remove);
