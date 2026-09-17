import 'dotenv/config';
import mongoose from 'mongoose';
import { materialPurchaseTrackingRepository } from '../src/repositories/materialPurchaseTrackingRepository';
import { resolveMaterialPurchaseTrackings } from './seed-material-trackings-lib';

async function seedMaterialPurchaseTrackings() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const rows = await resolveMaterialPurchaseTrackings();
  await materialPurchaseTrackingRepository.deleteAll();
  await materialPurchaseTrackingRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} material purchase trackings`);
  await mongoose.disconnect();
}

seedMaterialPurchaseTrackings().catch((err) => {
  console.error(err);
  process.exit(1);
});
