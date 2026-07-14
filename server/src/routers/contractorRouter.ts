import { Router } from 'express';
import { contractorController } from '../controllers/contractorController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const contractorRouter = Router();

contractorRouter.get('/', parseListQuery, contractorController.list);
contractorRouter.post('/', contractorController.create);
contractorRouter.post('/bulk-delete', contractorController.bulkRemove);
contractorRouter.put('/:id', contractorController.update);
contractorRouter.delete('/:id', contractorController.remove);
