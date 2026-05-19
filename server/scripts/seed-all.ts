import 'dotenv/config';
import mongoose from 'mongoose';
import { ContractorModel } from '../src/models/Contractor';
import { CustomerModel } from '../src/models/Customer';
import { EmployeeModel } from '../src/models/Employee';
import { PlotModel } from '../src/models/Plot';
import { AgriculturalSeasonModel } from '../src/models/AgriculturalSeason';
import { FuelTankModel } from '../src/models/FuelTank';
import { fuelTankRepository } from '../src/repositories/fuelTankRepository';
import type { FuelTankInput } from '../src/repositories/fuelTankRepository';
import { OperationModel } from '../src/models/Operation';
import { TractorModel } from '../src/models/Tractor';
import { agriculturalSeasonRepository } from '../src/repositories/agriculturalSeasonRepository';
import type { AgriculturalSeasonInput } from '../src/repositories/agriculturalSeasonRepository';
import { contractorRepository } from '../src/repositories/contractorRepository';
import type { ContractorInput } from '../src/repositories/contractorRepository';
import { customerRepository } from '../src/repositories/customerRepository';
import type { CustomerInput } from '../src/repositories/customerRepository';
import { employeeRepository } from '../src/repositories/employeeRepository';
import type { EmployeeInput } from '../src/repositories/employeeRepository';
import { operationRepository } from '../src/repositories/operationRepository';
import type { OperationInput } from '../src/repositories/operationRepository';
import { tractorRepository } from '../src/repositories/tractorRepository';
import type { TractorInput } from '../src/repositories/tractorRepository';
import {
  loadContractorsSeed,
  loadCustomersSeed,
  loadEmployeesSeed,
  loadAgriculturalSeasonsSeed,
  loadFuelTanksSeed,
  loadOperationsSeed,
  loadTractorsSeed,
} from './loadSeedData';
import { seedPlotsIntoDb } from './seed-plots-lib';
import { toSeedInput } from './seed-utils';

async function seedAll() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  await Promise.all([
    ContractorModel.syncIndexes(),
    CustomerModel.syncIndexes(),
    EmployeeModel.syncIndexes(),
    OperationModel.syncIndexes(),
    TractorModel.syncIndexes(),
    PlotModel.syncIndexes(),
    AgriculturalSeasonModel.syncIndexes(),
    FuelTankModel.syncIndexes(),
  ]);

  const contractors = toSeedInput<ContractorInput>(loadContractorsSeed());
  await contractorRepository.deleteAll();
  await contractorRepository.insertMany(contractors);
  console.log(`Seeded ${contractors.length} contractors`);

  const customers = toSeedInput<CustomerInput>(loadCustomersSeed());
  await customerRepository.deleteAll();
  await customerRepository.insertMany(customers);
  console.log(`Seeded ${customers.length} customers`);

  const employees = toSeedInput<EmployeeInput>(loadEmployeesSeed());
  await employeeRepository.deleteAll();
  await employeeRepository.insertMany(employees);
  console.log(`Seeded ${employees.length} employees`);

  const tractors = toSeedInput<TractorInput>(loadTractorsSeed());
  await tractorRepository.deleteAll();
  await tractorRepository.insertMany(tractors);
  console.log(`Seeded ${tractors.length} tractors`);

  const operations = toSeedInput<Record<string, unknown>>(loadOperationsSeed()).map((row) => ({
    operationNumber: row.operationNumber as number,
    name: row.name as string,
    pricingForm: row.pricingForm as OperationInput['pricingForm'],
    operationType: row.operationType as OperationInput['operationType'],
    currentCost: row.currentCost as number,
    costHistory: (row.costHistory as { cost: number; effectiveFrom: string }[]).map((entry) => ({
      cost: entry.cost,
      effectiveFrom: new Date(entry.effectiveFrom),
    })),
  }));
  await operationRepository.deleteAll();
  await operationRepository.insertMany(operations);
  console.log(`Seeded ${operations.length} operations`);

  const plotCount = await seedPlotsIntoDb();
  console.log(`Seeded ${plotCount} plots`);

  const seasons = toSeedInput<AgriculturalSeasonInput>(loadAgriculturalSeasonsSeed());
  await agriculturalSeasonRepository.deleteAll();
  await agriculturalSeasonRepository.insertMany(seasons);
  console.log(`Seeded ${seasons.length} agricultural seasons`);

  const fuelTanks = toSeedInput<FuelTankInput>(loadFuelTanksSeed());
  await fuelTankRepository.deleteAll();
  await fuelTankRepository.insertMany(fuelTanks);
  console.log(`Seeded ${fuelTanks.length} fuel tanks`);

  await mongoose.disconnect();
  console.log('Done');
}

seedAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
