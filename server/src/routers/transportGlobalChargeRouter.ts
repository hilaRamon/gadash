import { Router } from 'express';
import { transportGlobalChargeController } from '../controllers/transportGlobalChargeController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const transportGlobalChargeRouter = Router();

transportGlobalChargeRouter.get(
  '/preview',
  transportGlobalChargeController.preview,
);
transportGlobalChargeRouter.get('/', parseListQuery, transportGlobalChargeController.list);
transportGlobalChargeRouter.get('/:id', transportGlobalChargeController.getById);
transportGlobalChargeRouter.post('/', transportGlobalChargeController.execute);
transportGlobalChargeRouter.delete('/:id', transportGlobalChargeController.cancel);
