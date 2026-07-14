import { Router } from 'express';
import { materialPurchaseTrackingController } from '../controllers/materialPurchaseTrackingController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const materialPurchaseTrackingRouter = Router();

materialPurchaseTrackingRouter.get('/', parseListQuery, materialPurchaseTrackingController.list);
materialPurchaseTrackingRouter.post('/', materialPurchaseTrackingController.create);
materialPurchaseTrackingRouter.post('/bulk-delete', materialPurchaseTrackingController.bulkRemove);
materialPurchaseTrackingRouter.put('/:id', materialPurchaseTrackingController.update);
materialPurchaseTrackingRouter.delete('/:id', materialPurchaseTrackingController.remove);
