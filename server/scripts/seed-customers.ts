import 'dotenv/config';
import mongoose from 'mongoose';
import { customerRepository } from '../src/repositories/customerRepository';
import type { CustomerInput } from '../src/repositories/customerRepository';
import { loadCustomersSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

async function seedCustomers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadCustomersSeed();
  const rows = toSeedInput<CustomerInput>(seedData);
  await customerRepository.deleteAll();
  await customerRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} customers`);
  await mongoose.disconnect();
}

seedCustomers().catch((err) => {
  console.error(err);
  process.exit(1);
});
