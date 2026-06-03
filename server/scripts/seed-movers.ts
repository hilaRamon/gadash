import 'dotenv/config';
import mongoose from 'mongoose';
import { moverRepository } from '../src/repositories/moverRepository';
import type { MoverInput } from '../src/repositories/moverRepository';
import { loadMoversSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

async function seedMovers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadMoversSeed();
  const rows = toSeedInput<MoverInput>(seedData);
  await moverRepository.deleteAll();
  await moverRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} movers`);
  await mongoose.disconnect();
}

seedMovers().catch((err) => {
  console.error(err);
  process.exit(1);
});
