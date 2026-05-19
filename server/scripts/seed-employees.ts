import 'dotenv/config';
import mongoose from 'mongoose';
import { employeeRepository } from '../src/repositories/employeeRepository';
import type { EmployeeInput } from '../src/repositories/employeeRepository';
import { loadEmployeesSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

async function seedEmployees() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadEmployeesSeed();
  const rows = toSeedInput<EmployeeInput>(seedData);
  await employeeRepository.deleteAll();
  await employeeRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} employees`);
  await mongoose.disconnect();
}

seedEmployees().catch((err) => {
  console.error(err);
  process.exit(1);
});
