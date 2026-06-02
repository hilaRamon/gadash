import 'dotenv/config';
import mongoose from 'mongoose';
import { MaterialModel } from '../src/models/Material';

async function unsetMaterialBillingUnit() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const result = await MaterialModel.updateMany({}, { $unset: { billingUnit: '' } });
  console.log(`Unset billingUnit from ${result.modifiedCount} materials`);

  await MaterialModel.syncIndexes();
  console.log('Synced material indexes');

  await mongoose.disconnect();
}

unsetMaterialBillingUnit().catch((err) => {
  console.error(err);
  process.exit(1);
});
