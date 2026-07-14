import { Router } from 'express';
import { transportTrackingController } from '../controllers/transportTrackingController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const transportTrackingRouter = Router();

transportTrackingRouter.get('/', parseListQuery, transportTrackingController.list);
transportTrackingRouter.post('/', transportTrackingController.create);
transportTrackingRouter.post('/bulk-delete', transportTrackingController.bulkRemove);
transportTrackingRouter.put('/:id', transportTrackingController.update);
transportTrackingRouter.delete('/:id', transportTrackingController.remove);
