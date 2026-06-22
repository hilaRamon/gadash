import { Router } from 'express';
import { monthlyReportController } from '../controllers/monthlyReportController';

export const monthlyReportRouter = Router();

monthlyReportRouter.get('/summary', monthlyReportController.summary);
monthlyReportRouter.post('/close', monthlyReportController.close);
monthlyReportRouter.post('/close-all', monthlyReportController.closeAll);
monthlyReportRouter.get('/:employeeId/:month', monthlyReportController.employeeReport);
monthlyReportRouter.patch(
  '/:employeeId/:month/absence',
  monthlyReportController.updateAbsence,
);
