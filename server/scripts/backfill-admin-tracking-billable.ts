import 'dotenv/config';
import mongoose from 'mongoose';
import { OperationModel } from '../src/models/Operation';
import { OperationTrackingModel } from '../src/models/OperationTracking';

async function backfillAdminTrackingBillable() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const adminOperations = await OperationModel.find({ operationType: 'מנהלה' })
    .select('_id')
    .lean();
  const operationIds = adminOperations.map((operation) => operation._id);

  if (operationIds.length === 0) {
    console.log('No מנהלה operations found. Nothing to update.');
    await mongoose.disconnect();
    return;
  }

  const result = await OperationTrackingModel.updateMany(
    {
      operation: { $in: operationIds },
      billable: { $ne: false },
    },
    { $set: { billable: false } },
  );

  console.log(
    `Set billable=false on ${result.modifiedCount} מנהלה operation trackings (${result.matchedCount} matched, ${operationIds.length} מנהלה operations)`,
  );

  await mongoose.disconnect();
}

backfillAdminTrackingBillable().catch((err) => {
  console.error(err);
  process.exit(1);
});
