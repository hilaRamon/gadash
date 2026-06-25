import { Router } from 'express';
import { operationsSummaryController } from '../controllers/operationsSummaryController';

export const summariesRouter = Router();

summariesRouter.get('/operations', operationsSummaryController.operations);
