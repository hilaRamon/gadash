import { Router } from 'express';
import { tractorController } from '../controllers/tractorController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const tractorRouter = Router();

tractorRouter.get('/', parseListQuery, tractorController.list);
tractorRouter.post('/', tractorController.create);
tractorRouter.post('/bulk-delete', tractorController.bulkRemove);
tractorRouter.put('/:id', tractorController.update);
tractorRouter.delete('/:id', tractorController.remove);
