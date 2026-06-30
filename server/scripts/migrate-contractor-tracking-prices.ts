import 'dotenv/config';
import mongoose from 'mongoose';
import { ContractorTrackingModel } from '../src/models/ContractorTracking';

async function migrateContractorTrackingPrices() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const rows = await ContractorTrackingModel.find({}).lean();
  let converted = 0;

  for (const row of rows) {
    const doc = row as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    const unset: Record<string, 1> = {
      finalPrice: 1,
      customerPrice: 1,
    };

    const customerPrice = doc.customerPrice;
    const unitAmount = Number(doc.unitAmount ?? 0);
    const hasUnitCustomerPrice =
      doc.unitCustomerPrice != null && doc.unitCustomerPrice !== '';

    if (
      !hasUnitCustomerPrice &&
      customerPrice != null &&
      customerPrice !== '' &&
      Number.isFinite(Number(customerPrice)) &&
      Number.isFinite(unitAmount) &&
      unitAmount > 0
    ) {
      update.unitCustomerPrice = Number(
        (Number(customerPrice) / unitAmount).toFixed(3),
      );
      converted += 1;
    }

    await ContractorTrackingModel.updateOne(
      { _id: row._id },
      {
        ...(Object.keys(update).length > 0 ? { $set: update } : {}),
        $unset: unset,
      },
    );
  }

  console.log(`Migrated ${rows.length} contractor tracking documents`);
  console.log(`Converted customerPrice to unitCustomerPrice on ${converted} documents`);

  await mongoose.disconnect();
}

migrateContractorTrackingPrices().catch((err) => {
  console.error(err);
  process.exit(1);
});
