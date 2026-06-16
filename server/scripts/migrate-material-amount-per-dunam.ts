import 'dotenv/config';
import mongoose from 'mongoose';
import { MaterialModel } from '../src/models/Material';

const AMOUNT_PER_DUNAM_BY_NAME: Record<string, number> = {
  טייפון: 0.25,
  אור: 0.004,
  שטח: 0.015,
  'אלבר מ': 0.1,
  'טופ גן': 0.08,
  'אופטוס 100': 0.08,
  'אוראה לפני זריעה': 3,
  'אוראה אחרי זריעה': 10,
};

async function migrateMaterialAmountPerDunam() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  let updatedCount = 0;

  for (const [name, amountPerDunam] of Object.entries(AMOUNT_PER_DUNAM_BY_NAME)) {
    const result = await MaterialModel.updateOne(
      { name },
      { $set: { amountPerDunam } },
    );
    if (result.matchedCount === 0 && name === 'שטח') {
      await MaterialModel.create({
        name: 'שטח',
        amountPerDunam,
        currentQuantity: 0,
        currentBuyingCost: 34,
        currentSalePercent: 15,
        pricingHistory: [
          {
            cost: 34,
            percent: 15,
            effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
          },
        ],
      });
      console.log('Created material: שטח');
      updatedCount += 1;
      continue;
    }
    updatedCount += result.modifiedCount;
    if (result.matchedCount > 0) {
      console.log(`Updated ${name} -> amountPerDunam=${amountPerDunam}`);
    } else {
      console.log(`Skipped ${name} (not found)`);
    }
  }

  const urea = await MaterialModel.findOne({ name: 'אוראה' }).lean();
  if (urea) {
    await MaterialModel.findByIdAndUpdate(urea._id, {
      $set: {
        name: 'אוראה לפני זריעה',
        amountPerDunam: 3,
      },
    });
    console.log('Renamed אוראה -> אוראה לפני זריעה');

    const alreadyExists = await MaterialModel.findOne({
      name: 'אוראה אחרי זריעה',
    }).lean();
    if (!alreadyExists) {
      await MaterialModel.create({
        name: 'אוראה אחרי זריעה',
        amountPerDunam: 10,
        currentQuantity: urea.currentQuantity ?? 0,
        currentBuyingCost: urea.currentBuyingCost ?? 0,
        currentSalePercent: urea.currentSalePercent ?? 15,
        pricingHistory: urea.pricingHistory ?? [],
      });
      console.log('Created material: אוראה אחרי זריעה');
      updatedCount += 2;
    }
  }

  console.log(`Migration complete (${updatedCount} material records changed/created)`);
  await mongoose.disconnect();
}

migrateMaterialAmountPerDunam().catch((err) => {
  console.error(err);
  process.exit(1);
});
