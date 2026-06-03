import { Router } from 'express';
import { moverController } from '../controllers/moverController';

export const moverRouter = Router();

moverRouter.get('/', moverController.list);
moverRouter.post('/', moverController.create);
moverRouter.post('/bulk-delete', moverController.bulkRemove);
moverRouter.put('/:id', moverController.update);
moverRouter.delete('/:id', moverController.remove);
