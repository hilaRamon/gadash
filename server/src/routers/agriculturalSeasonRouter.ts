import { Router } from 'express';
import { agriculturalSeasonController } from '../controllers/agriculturalSeasonController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const agriculturalSeasonRouter = Router();

agriculturalSeasonRouter.get('/', parseListQuery, agriculturalSeasonController.list);
agriculturalSeasonRouter.post('/', agriculturalSeasonController.create);
agriculturalSeasonRouter.post('/bulk-delete', agriculturalSeasonController.bulkRemove);
agriculturalSeasonRouter.put('/:id', agriculturalSeasonController.update);
agriculturalSeasonRouter.delete('/:id', agriculturalSeasonController.remove);
