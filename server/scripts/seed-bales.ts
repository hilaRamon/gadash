import 'dotenv/config';
import mongoose from 'mongoose';
import { baleRepository } from '../src/repositories/baleRepository';
import type { BaleInput } from '../src/repositories/baleRepository';
import { loadBalesSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

async function seedBales() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadBalesSeed();
  const rows = toSeedInput<BaleInput>(seedData);
  await baleRepository.deleteAll();
  await baleRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} bales`);
  await mongoose.disconnect();
}

seedBales().catch((err) => {
  console.error(err);
  process.exit(1);
});
