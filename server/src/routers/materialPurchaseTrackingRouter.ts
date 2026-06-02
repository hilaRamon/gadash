import { Router } from 'express';
import { materialPurchaseTrackingController } from '../controllers/materialPurchaseTrackingController';

export const materialPurchaseTrackingRouter = Router();

materialPurchaseTrackingRouter.get('/', materialPurchaseTrackingController.list);
materialPurchaseTrackingRouter.post('/', materialPurchaseTrackingController.create);
materialPurchaseTrackingRouter.post('/bulk-delete', materialPurchaseTrackingController.bulkRemove);
materialPurchaseTrackingRouter.put('/:id', materialPurchaseTrackingController.update);
materialPurchaseTrackingRouter.delete('/:id', materialPurchaseTrackingController.remove);
