import { Router } from 'express';
import { fuelTankController } from '../controllers/fuelTankController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const fuelTankRouter = Router();

fuelTankRouter.get('/', parseListQuery, fuelTankController.list);
fuelTankRouter.post('/', fuelTankController.create);
fuelTankRouter.post('/bulk-delete', fuelTankController.bulkRemove);
fuelTankRouter.put('/:id', fuelTankController.update);
fuelTankRouter.delete('/:id', fuelTankController.remove);
