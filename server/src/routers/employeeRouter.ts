import { Router } from 'express';
import { employeeController } from '../controllers/employeeController';
import { parseListQuery } from '../middleware/listQueryMiddleware';

export const employeeRouter = Router();

employeeRouter.get('/', parseListQuery, employeeController.list);
employeeRouter.post('/', employeeController.create);
employeeRouter.post('/bulk-delete', employeeController.bulkRemove);
employeeRouter.put('/:id', employeeController.update);
employeeRouter.delete('/:id', employeeController.remove);
