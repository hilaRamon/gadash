import 'dotenv/config';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { materialPurchaseTrackingRepository } from '../src/repositories/materialPurchaseTrackingRepository';
import type { MaterialPurchaseTrackingInput } from '../src/repositories/materialPurchaseTrackingRepository';
import { loadMaterialPurchaseTrackingsSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

function toTrackingRows(
  rows: ReturnType<typeof loadMaterialPurchaseTrackingsSeed>,
): MaterialPurchaseTrackingInput[] {
  return toSeedInput<Record<string, unknown>>(rows).map((row) => ({
    date: new Date(String(row.date ?? '')),
    material: new Types.ObjectId(String(row.material)),
    supplier: new Types.ObjectId(String(row.supplier)),
    unitPrice: Number(row.unitPrice),
    amount: Number(row.amount),
    finalPrice: Number(row.finalPrice),
  }));
}

async function seedMaterialPurchaseTrackings() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadMaterialPurchaseTrackingsSeed();
  const rows = toTrackingRows(seedData);
  await materialPurchaseTrackingRepository.deleteAll();
  await materialPurchaseTrackingRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} material purchase trackings`);
  await mongoose.disconnect();
}

seedMaterialPurchaseTrackings().catch((err) => {
  console.error(err);
  process.exit(1);
});
