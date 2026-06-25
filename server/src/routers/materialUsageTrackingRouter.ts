import { Router } from 'express';
import { materialUsageTrackingController } from '../controllers/materialUsageTrackingController';
import { requireAdmin } from '../middleware/authMiddleware';

export const materialUsageTrackingRouter = Router();

materialUsageTrackingRouter.post('/', materialUsageTrackingController.create);

materialUsageTrackingRouter.use(requireAdmin);
materialUsageTrackingRouter.get('/', materialUsageTrackingController.list);
materialUsageTrackingRouter.post('/bulk-delete', materialUsageTrackingController.bulkRemove);
materialUsageTrackingRouter.put('/:id', materialUsageTrackingController.update);
materialUsageTrackingRouter.delete('/:id', materialUsageTrackingController.remove);
