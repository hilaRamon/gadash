import 'dotenv/config';
import mongoose from 'mongoose';
import { supplierRepository } from '../src/repositories/supplierRepository';
import type { SupplierInput } from '../src/repositories/supplierRepository';
import { loadSuppliersSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

async function seedSuppliers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadSuppliersSeed();
  const rows = toSeedInput<SupplierInput>(seedData);
  await supplierRepository.deleteAll();
  await supplierRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} suppliers`);
  await mongoose.disconnect();
}

seedSuppliers().catch((err) => {
  console.error(err);
  process.exit(1);
});
