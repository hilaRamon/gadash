import 'dotenv/config';
import mongoose from 'mongoose';
import { TransportTrackingModel } from '../src/models/TransportTracking';

async function backfillTransportCustomerHourlyRate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  const result = await TransportTrackingModel.collection.updateMany({}, [
    {
      $set: {
        customerHourlyRate: { $ifNull: ['$hourlyRate', 0] },
      },
    },
  ]);

  console.log(
    `Set customerHourlyRate = hourlyRate on ${result.modifiedCount} of ${result.matchedCount} transport trackings`,
  );

  await mongoose.disconnect();
}

backfillTransportCustomerHourlyRate().catch((err) => {
  console.error(err);
  process.exit(1);
});
