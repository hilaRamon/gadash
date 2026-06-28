import 'dotenv/config';
import mongoose from 'mongoose';
import { materialRepository } from '../src/repositories/materialRepository';
import type { MaterialInput } from '../src/repositories/materialRepository';
import { loadMaterialsSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

function toMaterialInput(rows: ReturnType<typeof loadMaterialsSeed>): MaterialInput[] {
  return toSeedInput<Record<string, unknown>>(rows).map((row) => ({
    name: row.name as string,
    amountPerDunam:
      row.amountPerDunam == null || row.amountPerDunam === ''
        ? null
        : Number(row.amountPerDunam),
    inventoryGroup:
      row.inventoryGroup == null || row.inventoryGroup === ''
        ? null
        : String(row.inventoryGroup),
    currentQuantity: row.currentQuantity as number,
    currentBuyingCost: row.currentBuyingCost as number,
    currentSalePercent: row.currentSalePercent as number,
    pricingHistory: (
      row.pricingHistory as { cost: number; percent: number; effectiveFrom: string }[]
    ).map((entry) => ({
      cost: entry.cost,
      percent: entry.percent,
      effectiveFrom: new Date(entry.effectiveFrom),
    })),
  }));
}

async function seedMaterials() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadMaterialsSeed();
  const rows = toMaterialInput(seedData);
  await materialRepository.deleteAll();
  await materialRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} materials`);
  await mongoose.disconnect();
}

seedMaterials().catch((err) => {
  console.error(err);
  process.exit(1);
});
