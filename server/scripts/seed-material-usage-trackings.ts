import 'dotenv/config';
import mongoose from 'mongoose';
import { materialUsageTrackingRepository } from '../src/repositories/materialUsageTrackingRepository';
import { resolveMaterialUsageTrackings } from './seed-material-trackings-lib';

async function seedMaterialUsageTrackings() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const rows = await resolveMaterialUsageTrackings();
  await materialUsageTrackingRepository.deleteAll();
  await materialUsageTrackingRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} material usage trackings`);
  await mongoose.disconnect();
}

seedMaterialUsageTrackings().catch((err) => {
  console.error(err);
  process.exit(1);
});
