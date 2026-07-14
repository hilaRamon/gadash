import { Router } from 'express';
import { baleController } from '../controllers/baleController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const baleRouter = Router();

baleRouter.get('/', parseListQuery, baleController.list);
baleRouter.post('/', baleController.create);
baleRouter.post('/bulk-delete', baleController.bulkRemove);
baleRouter.put('/:id', baleController.update);
baleRouter.delete('/:id', baleController.remove);
