import 'dotenv/config';
import mongoose from 'mongoose';
import { seedPlotsIntoDb } from './seed-plots-lib';

async function seedPlots() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const count = await seedPlotsIntoDb();
  console.log(`Seeded ${count} plots`);

  await mongoose.disconnect();
}

seedPlots().catch((err) => {
  console.error(err);
  process.exit(1);
});
