import { Router } from 'express';
import { fuelOperationTrackingController } from '../controllers/fuelOperationTrackingController';
import { requireAdmin } from '../middleware/authMiddleware';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const fuelOperationTrackingRouter = Router();

fuelOperationTrackingRouter.post('/', fuelOperationTrackingController.create);

fuelOperationTrackingRouter.use(requireAdmin);
fuelOperationTrackingRouter.get('/', parseListQuery, fuelOperationTrackingController.list);
fuelOperationTrackingRouter.post('/bulk-delete', fuelOperationTrackingController.bulkRemove);
fuelOperationTrackingRouter.put('/:id', fuelOperationTrackingController.update);
fuelOperationTrackingRouter.delete('/:id', fuelOperationTrackingController.remove);
