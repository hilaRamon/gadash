import 'dotenv/config';
import mongoose from 'mongoose';
import { ContractorModel } from '../src/models/Contractor';
import { CustomerModel } from '../src/models/Customer';
import { EmployeeModel } from '../src/models/Employee';
import { PlotModel } from '../src/models/Plot';
import { TractorModel } from '../src/models/Tractor';
import { contractorRepository } from '../src/repositories/contractorRepository';
import type { ContractorInput } from '../src/repositories/contractorRepository';
import { customerRepository } from '../src/repositories/customerRepository';
import type { CustomerInput } from '../src/repositories/customerRepository';
import { employeeRepository } from '../src/repositories/employeeRepository';
import type { EmployeeInput } from '../src/repositories/employeeRepository';
import { tractorRepository } from '../src/repositories/tractorRepository';
import type { TractorInput } from '../src/repositories/tractorRepository';
import {
  loadContractorsSeed,
  loadCustomersSeed,
  loadEmployeesSeed,
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
    TractorModel.syncIndexes(),
    PlotModel.syncIndexes(),
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

  const plotCount = await seedPlotsIntoDb();
  console.log(`Seeded ${plotCount} plots`);

  await mongoose.disconnect();
  console.log('Done');
}

seedAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
