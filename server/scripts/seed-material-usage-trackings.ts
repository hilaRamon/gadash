import 'dotenv/config';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { materialUsageTrackingRepository } from '../src/repositories/materialUsageTrackingRepository';
import type { MaterialUsageTrackingInput } from '../src/repositories/materialUsageTrackingRepository';
import { loadMaterialUsageTrackingsSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

function toTrackingRows(
  rows: ReturnType<typeof loadMaterialUsageTrackingsSeed>,
): MaterialUsageTrackingInput[] {
  return toSeedInput<Record<string, unknown>>(rows).map((row) => ({
    date: new Date(String(row.date ?? '')),
    material: new Types.ObjectId(String(row.material)),
    plot: new Types.ObjectId(String(row.plot)),
    employee: new Types.ObjectId(String(row.employee)),
    amount: Number(row.amount),
    notes: String(row.notes ?? ''),
    billable: row.billable === false ? false : true,
  }));
}

async function seedMaterialUsageTrackings() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadMaterialUsageTrackingsSeed();
  const rows = toTrackingRows(seedData);
  await materialUsageTrackingRepository.deleteAll();
  await materialUsageTrackingRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} material usage trackings`);
  await mongoose.disconnect();
}

seedMaterialUsageTrackings().catch((err) => {
  console.error(err);
  process.exit(1);
});
