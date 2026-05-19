import 'dotenv/config';
import mongoose from 'mongoose';
import { fuelTankRepository } from '../src/repositories/fuelTankRepository';
import type { FuelTankInput } from '../src/repositories/fuelTankRepository';
import { loadFuelTanksSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

async function seedFuelTanks() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadFuelTanksSeed();
  const rows = toSeedInput<FuelTankInput>(seedData);
  await fuelTankRepository.deleteAll();
  await fuelTankRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} fuel tanks`);
  await mongoose.disconnect();
}

seedFuelTanks().catch((err) => {
  console.error(err);
  process.exit(1);
});
