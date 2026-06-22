import 'dotenv/config';
import mongoose from 'mongoose';
import { BaleOrderTrackingModel } from '../src/models/BaleOrderTracking';
import { ContractorTrackingModel } from '../src/models/ContractorTracking';
import { MaterialUsageTrackingModel } from '../src/models/MaterialUsageTracking';
import { OperationTrackingModel } from '../src/models/OperationTracking';

const missingWasCharged = {
  $or: [{ wasCharged: { $exists: false } }, { wasCharged: null }],
};

async function backfillWasCharged() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const [operations, materialUsage, contractors, baleOrders] = await Promise.all([
    OperationTrackingModel.updateMany(missingWasCharged, { $set: { wasCharged: false } }),
    MaterialUsageTrackingModel.updateMany(missingWasCharged, { $set: { wasCharged: false } }),
    ContractorTrackingModel.updateMany(missingWasCharged, { $set: { wasCharged: false } }),
    BaleOrderTrackingModel.updateMany(missingWasCharged, { $set: { wasCharged: false } }),
  ]);

  console.log(`Set wasCharged=false on ${operations.modifiedCount} operation trackings`);
  console.log(
    `Set wasCharged=false on ${materialUsage.modifiedCount} material usage trackings`,
  );
  console.log(`Set wasCharged=false on ${contractors.modifiedCount} contractor trackings`);
  console.log(`Set wasCharged=false on ${baleOrders.modifiedCount} bale order trackings`);

  await mongoose.disconnect();
}

backfillWasCharged().catch((err) => {
  console.error(err);
  process.exit(1);
});
