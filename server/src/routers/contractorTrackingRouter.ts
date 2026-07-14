import { Router } from 'express';
import { contractorTrackingController } from '../controllers/contractorTrackingController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const contractorTrackingRouter = Router();

contractorTrackingRouter.get('/', parseListQuery, contractorTrackingController.list);
contractorTrackingRouter.post('/', contractorTrackingController.create);
contractorTrackingRouter.post('/bulk-delete', contractorTrackingController.bulkRemove);
contractorTrackingRouter.put('/:id', contractorTrackingController.update);
contractorTrackingRouter.delete('/:id', contractorTrackingController.remove);
