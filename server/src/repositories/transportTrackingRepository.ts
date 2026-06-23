import { Types } from 'mongoose';
import { TransportTrackingModel } from '../models/TransportTracking';
import { toObjectIds } from '../utils/mongoIds';
import { buildSeasonDateQuery } from '../utils/seasonRange';

export type TransportTrackingInput = {
  date: Date;
  mover: Types.ObjectId;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  hours: number;
  finalPrice: number;
  notes?: string;
};

const moverPopulate = { path: 'mover', select: '_id name' };

export const transportTrackingRepository = {
  findAll(seasonYear?: number) {
    const filter = seasonYear != null ? buildSeasonDateQuery(seasonYear) : {};
    return TransportTrackingModel.find(filter)
      .populate(moverPopulate)
      .sort({ date: -1 })
      .lean();
  },

  findById(id: string) {
    return TransportTrackingModel.findById(id)
      .populate(moverPopulate)
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
      .populate(moverPopulate)
      .lean();
  },

  delete(id: string) {
    return TransportTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return TransportTrackingModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },
};
