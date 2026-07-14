import { Router } from 'express';
import { moverController } from '../controllers/moverController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const moverRouter = Router();

moverRouter.get('/', parseListQuery, moverController.list);
moverRouter.post('/', moverController.create);
moverRouter.post('/bulk-delete', moverController.bulkRemove);
moverRouter.put('/:id', moverController.update);
moverRouter.delete('/:id', moverController.remove);
