import { Router } from 'express';
import { customerBillingTrackingController } from '../controllers/customerBillingTrackingController';

export const customerBillingTrackingRouter = Router();

customerBillingTrackingRouter.get('/', customerBillingTrackingController.list);
customerBillingTrackingRouter.post('/', customerBillingTrackingController.create);
customerBillingTrackingRouter.post(
  '/bulk-delete',
  customerBillingTrackingController.bulkRemove,
);
customerBillingTrackingRouter.put('/:id', customerBillingTrackingController.update);
customerBillingTrackingRouter.delete('/:id', customerBillingTrackingController.remove);
