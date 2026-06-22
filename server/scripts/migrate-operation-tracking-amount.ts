import 'dotenv/config';
import mongoose from 'mongoose';
import { OperationTrackingModel } from '../src/models/OperationTracking';

async function migrateOperationTrackingAmount() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const result = await OperationTrackingModel.collection.updateMany(
    { dunam: { $exists: true } },
    { $rename: { dunam: 'amount' } },
  );

  console.log(`Renamed dunam → amount on ${result.modifiedCount} operation trackings`);

  await mongoose.disconnect();
}

migrateOperationTrackingAmount().catch((error) => {
  console.error(error);
  process.exit(1);
});
