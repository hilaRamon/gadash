import { Router } from 'express';
import { contractorRouter } from './contractorRouter';
import { customerRouter } from './customerRouter';
import { employeeRouter } from './employeeRouter';
import { agriculturalSeasonRouter } from './agriculturalSeasonRouter';
import { fuelTankRouter } from './fuelTankRouter';
import { operationRouter } from './operationRouter';
import { plotRouter } from './plotRouter';
import { tractorRouter } from './tractorRouter';

export const apiRouter = Router();

apiRouter.use('/contractors', contractorRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/employees', employeeRouter);
apiRouter.use('/tractors', tractorRouter);
apiRouter.use('/operations', operationRouter);
apiRouter.use('/plots', plotRouter);
apiRouter.use('/agriculturalSeasons', agriculturalSeasonRouter);
apiRouter.use('/fuelTanks', fuelTankRouter);
