import { Router } from 'express';
import { materialController } from '../controllers/materialController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const materialRouter = Router();

materialRouter.get('/', parseListQuery, materialController.list);
materialRouter.post('/', materialController.create);
materialRouter.post('/bulk-delete', materialController.bulkRemove);
materialRouter.post('/:id/pricing-changes', materialController.appendPricingChange);
materialRouter.put('/:id', materialController.update);
materialRouter.delete('/:id', materialController.remove);
