import { Router } from 'express';
import { contractorRouter } from './contractorRouter';
import { customerRouter } from './customerRouter';
import { employeeRouter } from './employeeRouter';
import { plotRouter } from './plotRouter';
import { tractorRouter } from './tractorRouter';

export const apiRouter = Router();

apiRouter.use('/contractors', contractorRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/employees', employeeRouter);
apiRouter.use('/tractors', tractorRouter);
apiRouter.use('/plots', plotRouter);
