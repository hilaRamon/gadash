import 'dotenv/config';
import mongoose from 'mongoose';
import { CustomerModel } from '../src/models/Customer';
import { OperationModel } from '../src/models/Operation';
import { PlotModel } from '../src/models/Plot';

async function unsetLegacyNumberFields() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const [customers, plots, operations] = await Promise.all([
    CustomerModel.updateMany({}, { $unset: { customerNumber: '' } }),
    PlotModel.updateMany({}, { $unset: { plotNumber: '' } }),
    OperationModel.updateMany({}, { $unset: { operationNumber: '' } }),
  ]);

  console.log(`Unset customerNumber from ${customers.modifiedCount} customers`);
  console.log(`Unset plotNumber from ${plots.modifiedCount} plots`);
  console.log(`Unset operationNumber from ${operations.modifiedCount} operations`);

  await Promise.all([
    CustomerModel.syncIndexes(),
    PlotModel.syncIndexes(),
    OperationModel.syncIndexes(),
  ]);
  console.log('Synced indexes');

  await mongoose.disconnect();
}

unsetLegacyNumberFields().catch((err) => {
  console.error(err);
  process.exit(1);
});
