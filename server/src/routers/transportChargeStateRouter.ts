import { Router } from 'express';
import { transportChargeStateController } from '../controllers/transportChargeStateController';

export const transportChargeStateRouter = Router();

transportChargeStateRouter.get('/', transportChargeStateController.get);
transportChargeStateRouter.put('/', transportChargeStateController.update);
