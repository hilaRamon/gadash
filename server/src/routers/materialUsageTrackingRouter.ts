import { Router } from 'express';
import { materialUsageTrackingController } from '../controllers/materialUsageTrackingController';

export const materialUsageTrackingRouter = Router();

materialUsageTrackingRouter.get('/', materialUsageTrackingController.list);
materialUsageTrackingRouter.post('/', materialUsageTrackingController.create);
materialUsageTrackingRouter.post('/bulk-delete', materialUsageTrackingController.bulkRemove);
materialUsageTrackingRouter.put('/:id', materialUsageTrackingController.update);
materialUsageTrackingRouter.delete('/:id', materialUsageTrackingController.remove);
