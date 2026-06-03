import 'dotenv/config';
import mongoose from 'mongoose';
import { OperationModel } from '../src/models/Operation';

async function migrateAdminOperationsToFieldWork() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const result = await OperationModel.updateMany(
    { operationType: 'מנהלה', name: { $nin: ['מנהלה', 'תדלוק'] } },
    { $set: { operationType: 'עיבוד' } },
  );

  const fuelOp = await OperationModel.updateOne(
    { name: 'תדלוק' },
    { $set: { operationType: 'דלק' } },
  );

  console.log(
    `Updated ${result.modifiedCount} operations from מנהלה to עיבוד (kept "מנהלה" and "תדלוק" unchanged)`,
  );
  console.log(
    `Set "תדלוק" to דלק (${fuelOp.modifiedCount} document${fuelOp.modifiedCount === 1 ? '' : 's'} updated)`,
  );

  await mongoose.disconnect();
}

migrateAdminOperationsToFieldWork().catch((err) => {
  console.error(err);
  process.exit(1);
});
