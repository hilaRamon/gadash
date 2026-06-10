import 'dotenv/config';
import mongoose from 'mongoose';
import { CustomerModel } from '../src/models/Customer';
import { customerBillingTrackingRepository } from '../src/repositories/customerBillingTrackingRepository';

async function seedCustomerBillingExample() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const customer = await CustomerModel.findOne().select('_id name').lean();
  if (!customer?._id) {
    throw new Error('No customers in DB. Run: npm run seed:customers');
  }

  const existing = await customerBillingTrackingRepository.findAll();
  if (existing.length > 0) {
    console.log(`Customer billing trackings already exist (${existing.length}). Skipping.`);
    await mongoose.disconnect();
    return;
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const created = await customerBillingTrackingRepository.create({
    date: today,
    customer: customer._id as mongoose.Types.ObjectId,
    notes: 'דוגמה לחיוב לקוח',
    status: 'לא אושר כלל',
    paid: false,
    finalPrice: 12500,
  });

  console.log(
    `Created customer billing example for "${customer.name}" (id: ${String(created._id)})`,
  );
  await mongoose.disconnect();
}

seedCustomerBillingExample().catch((err) => {
  console.error(err);
  process.exit(1);
});
