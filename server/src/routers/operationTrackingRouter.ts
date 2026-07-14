import { Router } from 'express';
import { operationTrackingController } from '../controllers/operationTrackingController';
import { requireAdmin } from '../middleware/authMiddleware';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const operationTrackingRouter = Router();

operationTrackingRouter.post('/', operationTrackingController.create);

operationTrackingRouter.use(requireAdmin);
operationTrackingRouter.get('/', parseListQuery, operationTrackingController.list);
operationTrackingRouter.post('/bulk-delete', operationTrackingController.bulkRemove);
operationTrackingRouter.put('/:id', operationTrackingController.update);
operationTrackingRouter.delete('/:id', operationTrackingController.remove);
