import { Router } from 'express';
import { operationTrackingController } from '../controllers/operationTrackingController';

export const operationTrackingRouter = Router();

operationTrackingRouter.get('/', operationTrackingController.list);
operationTrackingRouter.post('/', operationTrackingController.create);
operationTrackingRouter.post('/bulk-delete', operationTrackingController.bulkRemove);
operationTrackingRouter.put('/:id', operationTrackingController.update);
operationTrackingRouter.delete('/:id', operationTrackingController.remove);
