import { Router } from 'express';
import { fuelTankController } from '../controllers/fuelTankController';

export const fuelTankRouter = Router();

fuelTankRouter.get('/', fuelTankController.list);
fuelTankRouter.post('/', fuelTankController.create);
fuelTankRouter.post('/bulk-delete', fuelTankController.bulkRemove);
fuelTankRouter.put('/:id', fuelTankController.update);
fuelTankRouter.delete('/:id', fuelTankController.remove);
