import { Router } from 'express';
import { fuelOperationTrackingController } from '../controllers/fuelOperationTrackingController';

export const fuelOperationTrackingRouter = Router();

fuelOperationTrackingRouter.get('/', fuelOperationTrackingController.list);
fuelOperationTrackingRouter.post('/', fuelOperationTrackingController.create);
fuelOperationTrackingRouter.post('/bulk-delete', fuelOperationTrackingController.bulkRemove);
fuelOperationTrackingRouter.put('/:id', fuelOperationTrackingController.update);
fuelOperationTrackingRouter.delete('/:id', fuelOperationTrackingController.remove);
