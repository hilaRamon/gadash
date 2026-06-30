import { Types } from 'mongoose';
import { TransportTrackingModel } from '../models/TransportTracking';
import { toObjectIds } from '../utils/mongoIds';
import { buildSeasonDateQuery } from '../utils/seasonRange';
import { unchargedGlobalTransportsInSeasonFilter } from '../utils/unbilledTrackingFilters';
import type { TransportBillingType } from '../models/TransportTracking';

export type TransportTrackingInput = {
  date: Date;
  mover: Types.ObjectId;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  hours: number;
  finalPrice: number;
  billing: TransportBillingType;
  customer?: Types.ObjectId | null;
  notes?: string;
  wasCharged?: boolean;
};

const moverPopulate = { path: 'mover', select: '_id name' };
const customerPopulate = { path: 'customer', select: '_id name' };
const populateRefs = [moverPopulate, customerPopulate];

export const transportTrackingRepository = {
  findAll(seasonYear?: number) {
    const filter = seasonYear != null ? buildSeasonDateQuery(seasonYear) : {};
    return TransportTrackingModel.find(filter)
      .populate(populateRefs)
      .sort({ date: -1 })
      .lean();
  },

  findById(id: string) {
    return TransportTrackingModel.findById(id)
      .populate(populateRefs)
      .lean();
  },

  create(data: TransportTrackingInput) {
    return TransportTrackingModel.create(data);
  },

  update(id: string, data: Partial<TransportTrackingInput>) {
    return TransportTrackingModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate(populateRefs)
      .lean();
  },

  delete(id: string) {
    return TransportTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return TransportTrackingModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  markCharged(ids: Types.ObjectId[], session?: unknown) {
    if (ids.length === 0) return Promise.resolve(null);
    return TransportTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: true },
      session ? { session: session as never } : undefined,
    );
  },

  markUncharged(ids: Types.ObjectId[], session?: unknown) {
    if (ids.length === 0) return Promise.resolve(null);
    return TransportTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: false },
      session ? { session: session as never } : undefined,
    );
  },

  findUnchargedGlobalInSeason(seasonYear: number, session?: unknown) {
    const query = TransportTrackingModel.find(
      unchargedGlobalTransportsInSeasonFilter(seasonYear),
    ).select('_id finalPrice');

    if (session) {
      query.session(session as never);
    }

    return query.lean();
  },
};
