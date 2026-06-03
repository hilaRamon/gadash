import { Router } from 'express';
import { baleOrderTrackingController } from '../controllers/baleOrderTrackingController';

export const baleOrderTrackingRouter = Router();

baleOrderTrackingRouter.get('/', baleOrderTrackingController.list);
baleOrderTrackingRouter.post('/', baleOrderTrackingController.create);
baleOrderTrackingRouter.post('/bulk-delete', baleOrderTrackingController.bulkRemove);
baleOrderTrackingRouter.put('/:id', baleOrderTrackingController.update);
baleOrderTrackingRouter.delete('/:id', baleOrderTrackingController.remove);
