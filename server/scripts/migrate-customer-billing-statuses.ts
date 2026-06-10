import 'dotenv/config';
import mongoose from 'mongoose';
import { CustomerBillingTrackingModel } from '../src/models/CustomerBillingTracking';

async function migrateCustomerBillingStatuses() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const [internalApproved, invoiceReceived] = await Promise.all([
    CustomerBillingTrackingModel.updateMany(
      { status: 'אושר פנימי' },
      { $set: { status: 'לא אושר כלל' } },
    ),
    CustomerBillingTrackingModel.updateMany(
      { status: 'התקבלה חשבונית' },
      { $set: { status: 'הופקה חשבונית' } },
    ),
  ]);

  console.log(
    `Migrated ${internalApproved.modifiedCount} billings from אושר פנימי → לא אושר כלל`,
  );
  console.log(
    `Migrated ${invoiceReceived.modifiedCount} billings from התקבלה חשבונית → הופקה חשבונית`,
  );

  await mongoose.disconnect();
}

migrateCustomerBillingStatuses().catch((err) => {
  console.error(err);
  process.exit(1);
});
