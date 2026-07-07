import 'dotenv/config';
import mongoose from 'mongoose';
import { ContractorTrackingModel } from '../src/models/ContractorTracking';

const LEGACY_DUNAM_PRICING = 'לפי דונם';
const DUNAM_PRICING = 'דונם';

async function migrateContractorPricingForm() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const result = await ContractorTrackingModel.updateMany(
    { pricingForm: LEGACY_DUNAM_PRICING },
    { $set: { pricingForm: DUNAM_PRICING } },
  );

  console.log(`Updated ${result.modifiedCount} contractor tracking documents`);
  console.log(`Set pricingForm="${DUNAM_PRICING}" (was "${LEGACY_DUNAM_PRICING}")`);

  await mongoose.disconnect();
}

migrateContractorPricingForm().catch((err) => {
  console.error(err);
  process.exit(1);
});
