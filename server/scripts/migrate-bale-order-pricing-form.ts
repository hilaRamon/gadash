import 'dotenv/config';
import mongoose from 'mongoose';
import { BaleOrderTrackingModel } from '../src/models/BaleOrderTracking';
import {
  BALE_ORDER_BY_UNIT,
  BALE_ORDER_BY_WEIGHT,
  hasWeightValue,
} from '../src/utils/baleOrderPricing';

async function migrateBaleOrderPricingForm() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const rows = await BaleOrderTrackingModel.find().lean();
  let byWeightCount = 0;
  let byUnitCount = 0;

  for (const row of rows) {
    const pricingForm = hasWeightValue(row.weight)
      ? BALE_ORDER_BY_WEIGHT
      : BALE_ORDER_BY_UNIT;

    await BaleOrderTrackingModel.updateOne({ _id: row._id }, { $set: { pricingForm } });

    if (pricingForm === BALE_ORDER_BY_WEIGHT) {
      byWeightCount += 1;
    } else {
      byUnitCount += 1;
    }
  }

  console.log(`Updated ${rows.length} bale order trackings`);
  console.log(`Set pricingForm="${BALE_ORDER_BY_WEIGHT}" on ${byWeightCount} rows`);
  console.log(`Set pricingForm="${BALE_ORDER_BY_UNIT}" on ${byUnitCount} rows`);

  await mongoose.disconnect();
}

migrateBaleOrderPricingForm().catch((err) => {
  console.error(err);
  process.exit(1);
});
