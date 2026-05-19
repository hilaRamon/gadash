import { Router } from 'express';
import { plotController } from '../controllers/plotController';

export const plotRouter = Router();

plotRouter.get('/', plotController.list);
plotRouter.post('/', plotController.create);
plotRouter.post('/bulk-delete', plotController.bulkRemove);
plotRouter.put('/:id', plotController.update);
plotRouter.delete('/:id', plotController.remove);
