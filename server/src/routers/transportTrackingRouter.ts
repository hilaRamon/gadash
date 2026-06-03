import { Router } from 'express';
import { transportTrackingController } from '../controllers/transportTrackingController';

export const transportTrackingRouter = Router();

transportTrackingRouter.get('/', transportTrackingController.list);
transportTrackingRouter.post('/', transportTrackingController.create);
transportTrackingRouter.post('/bulk-delete', transportTrackingController.bulkRemove);
transportTrackingRouter.put('/:id', transportTrackingController.update);
transportTrackingRouter.delete('/:id', transportTrackingController.remove);
