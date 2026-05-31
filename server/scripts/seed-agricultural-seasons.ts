import 'dotenv/config';
import mongoose from 'mongoose';
import { agriculturalSeasonRepository } from '../src/repositories/agriculturalSeasonRepository';
import type { AgriculturalSeasonInput } from '../src/repositories/agriculturalSeasonRepository';
import { loadAgriculturalSeasonsSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

async function seedAgriculturalSeasons() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadAgriculturalSeasonsSeed();
  const rows = toSeedInput<AgriculturalSeasonInput>(seedData);
  await agriculturalSeasonRepository.deleteAll();
  await agriculturalSeasonRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} agricultural seasons`);
  await mongoose.disconnect();
}

seedAgriculturalSeasons().catch((err) => {
  console.error(err);
  process.exit(1);
});
