import { Router } from 'express';
import { plotController } from '../controllers/plotController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const plotRouter = Router();

plotRouter.get('/', parseListQuery, plotController.list);
plotRouter.post('/', plotController.create);
plotRouter.post('/bulk-delete', plotController.bulkRemove);
plotRouter.put('/:id', plotController.update);
plotRouter.delete('/:id', plotController.remove);
