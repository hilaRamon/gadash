import { Router } from 'express';
import { agriculturalSeasonController } from '../controllers/agriculturalSeasonController';

export const agriculturalSeasonRouter = Router();

agriculturalSeasonRouter.get('/', agriculturalSeasonController.list);
agriculturalSeasonRouter.post('/', agriculturalSeasonController.create);
agriculturalSeasonRouter.post('/bulk-delete', agriculturalSeasonController.bulkRemove);
agriculturalSeasonRouter.put('/:id', agriculturalSeasonController.update);
agriculturalSeasonRouter.delete('/:id', agriculturalSeasonController.remove);
