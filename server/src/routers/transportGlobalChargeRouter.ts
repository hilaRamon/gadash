import { Router } from 'express';
import { transportGlobalChargeController } from '../controllers/transportGlobalChargeController';

export const transportGlobalChargeRouter = Router();

transportGlobalChargeRouter.get(
  '/preview',
  transportGlobalChargeController.preview,
);
transportGlobalChargeRouter.get('/', transportGlobalChargeController.list);
transportGlobalChargeRouter.get('/:id', transportGlobalChargeController.getById);
transportGlobalChargeRouter.post('/', transportGlobalChargeController.execute);
transportGlobalChargeRouter.delete('/:id', transportGlobalChargeController.cancel);
