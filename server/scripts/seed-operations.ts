import 'dotenv/config';
import mongoose from 'mongoose';
import { operationRepository } from '../src/repositories/operationRepository';
import type { OperationInput } from '../src/repositories/operationRepository';
import { loadOperationsSeed } from './loadSeedData';
import { toSeedInput } from './seed-utils';

function toOperationInput(rows: ReturnType<typeof loadOperationsSeed>): OperationInput[] {
  return toSeedInput<Record<string, unknown>>(rows).map((row) => {
    const costHistory = (row.costHistory as { cost: number; effectiveFrom: string }[]).map(
      (entry) => ({
        cost: entry.cost,
        effectiveFrom: new Date(entry.effectiveFrom),
      }),
    );

    return {
      operationNumber: row.operationNumber as number,
      name: row.name as string,
      pricingForm: row.pricingForm as OperationInput['pricingForm'],
      operationType: row.operationType as OperationInput['operationType'],
      currentCost: row.currentCost as number,
      costHistory,
    };
  });
}

async function seedOperations() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const seedData = loadOperationsSeed();
  const rows = toOperationInput(seedData);
  await operationRepository.deleteAll();
  await operationRepository.insertMany(rows);

  console.log(`Seeded ${rows.length} operations`);
  await mongoose.disconnect();
}

seedOperations().catch((err) => {
  console.error(err);
  process.exit(1);
});
