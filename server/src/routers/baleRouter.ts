import { Router } from 'express';
import { baleController } from '../controllers/baleController';

export const baleRouter = Router();

baleRouter.get('/', baleController.list);
baleRouter.post('/', baleController.create);
baleRouter.post('/bulk-delete', baleController.bulkRemove);
baleRouter.put('/:id', baleController.update);
baleRouter.delete('/:id', baleController.remove);
