import { Router } from 'express';
import { contractorController } from '../controllers/contractorController';

export const contractorRouter = Router();

contractorRouter.get('/', contractorController.list);
contractorRouter.post('/', contractorController.create);
contractorRouter.post('/bulk-delete', contractorController.bulkRemove);
contractorRouter.put('/:id', contractorController.update);
contractorRouter.delete('/:id', contractorController.remove);
