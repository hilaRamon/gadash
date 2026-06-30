import { Types } from 'mongoose';
import { TransportGlobalChargeModel } from '../models/TransportGlobalCharge';

export type TransportGlobalChargeInput = {
  seasonYear: number;
  executedAt?: Date;
  transportTotal: number;
  totalDunam: number;
  pricePerDunam: number;
  transportTrackingIds: Types.ObjectId[];
  customerBillingIds?: Types.ObjectId[];
};

export const transportGlobalChargeRepository = {
  create(data: TransportGlobalChargeInput, session?: unknown) {
    return TransportGlobalChargeModel.create([data], { session: session as never });
  },

  updateCustomerBillingIds(
    id: Types.ObjectId,
    customerBillingIds: Types.ObjectId[],
    session?: unknown,
  ) {
    return TransportGlobalChargeModel.findByIdAndUpdate(
      id,
      { customerBillingIds },
      { returnDocument: 'after', session: session as never },
    ).lean();
  },

  findById(id: string) {
    return TransportGlobalChargeModel.findById(id).lean();
  },

  findAll(seasonYear?: number) {
    const filter = seasonYear != null ? { seasonYear } : {};
    return TransportGlobalChargeModel.find(filter)
      .sort({ executedAt: -1 })
      .lean();
  },

  deleteById(id: string, session?: unknown) {
    return TransportGlobalChargeModel.findByIdAndDelete(id, {
      session: session as never,
    }).lean();
  },
};
