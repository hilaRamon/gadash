import { Types } from 'mongoose';
import { TransportGlobalAllocationModel } from '../models/TransportGlobalAllocation';
import { toObjectIds } from '../utils/mongoIds';

export type TransportGlobalAllocationInput = {
  globalTransportChargeId: Types.ObjectId;
  customer: Types.ObjectId;
  dunam: number;
  finalPrice: number;
  wasCharged?: boolean;
};

const customerPopulate = { path: 'customer', select: '_id name' };
const chargePopulate = {
  path: 'globalTransportChargeId',
  select: '_id pricePerDunam executedAt seasonYear',
};

export const unchargedAllocationFilter = { wasCharged: { $ne: true } } as const;

export const transportGlobalAllocationRepository = {
  createMany(data: TransportGlobalAllocationInput[], session?: unknown) {
    if (data.length === 0) return Promise.resolve([]);
    return TransportGlobalAllocationModel.create(data, {
      session: session as never,
    });
  },

  findById(id: string) {
    return TransportGlobalAllocationModel.findById(id)
      .populate(customerPopulate)
      .populate(chargePopulate)
      .lean();
  },

  findByIds(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return TransportGlobalAllocationModel.find({ _id: { $in: ids } })
      .populate(customerPopulate)
      .populate(chargePopulate)
      .lean();
  },

  findByChargeId(chargeId: Types.ObjectId | string, session?: unknown) {
    const id =
      typeof chargeId === 'string' ? new Types.ObjectId(chargeId) : chargeId;
    const query = TransportGlobalAllocationModel.find({
      globalTransportChargeId: id,
    })
      .populate(customerPopulate)
      .populate(chargePopulate)
      .sort({ finalPrice: -1 });

    if (session) {
      query.session(session as never);
    }

    return query.lean();
  },

  findUnchargedByCustomer(customerId: Types.ObjectId) {
    return TransportGlobalAllocationModel.find({
      ...unchargedAllocationFilter,
      customer: customerId,
    })
      .populate(customerPopulate)
      .populate(chargePopulate)
      .sort({ createdAt: -1 })
      .lean();
  },

  distinctUnchargedCustomerIds() {
    return TransportGlobalAllocationModel.distinct(
      'customer',
      unchargedAllocationFilter,
    );
  },

  async countChargedByChargeIds(
    chargeIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (chargeIds.length === 0) return counts;

    const rows = await TransportGlobalAllocationModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          globalTransportChargeId: { $in: chargeIds },
          wasCharged: true,
        },
      },
      { $group: { _id: '$globalTransportChargeId', count: { $sum: 1 } } },
    ]);

    for (const row of rows) {
      counts.set(String(row._id), Number(row.count ?? 0));
    }
    return counts;
  },

  markCharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return TransportGlobalAllocationModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: true },
    );
  },

  markUncharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return TransportGlobalAllocationModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: false },
    );
  },

  deleteByChargeId(chargeId: Types.ObjectId | string, session?: unknown) {
    const id =
      typeof chargeId === 'string' ? new Types.ObjectId(chargeId) : chargeId;
    return TransportGlobalAllocationModel.deleteMany(
      { globalTransportChargeId: id },
      session ? { session: session as never } : undefined,
    );
  },

  deleteByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return TransportGlobalAllocationModel.deleteMany({
      _id: { $in: toObjectIds(ids) },
    });
  },
};
