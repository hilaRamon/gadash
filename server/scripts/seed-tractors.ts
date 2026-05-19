import 'dotenv/config';
import mongoose from 'mongoose';
import { tractorRepository } from '../src/repositories/tractorRepository';
import type { TractorInput } from '../src/repositories/tractorRepository';
import { loadTractorsSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

async function seedTractors() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadTractorsSeed();
  const rows = toSeedInput<TractorInput>(seedData);
  await tractorRepository.deleteAll();
  await tractorRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} tractors`);
  await mongoose.disconnect();
}

seedTractors().catch((err) => {
  console.error(err);
  process.exit(1);
});
