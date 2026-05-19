import { Router } from 'express';
import { tractorController } from '../controllers/tractorController';

export const tractorRouter = Router();

tractorRouter.get('/', tractorController.list);
tractorRouter.post('/', tractorController.create);
tractorRouter.post('/bulk-delete', tractorController.bulkRemove);
tractorRouter.put('/:id', tractorController.update);
tractorRouter.delete('/:id', tractorController.remove);
