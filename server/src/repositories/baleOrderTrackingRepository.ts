import { BaleOrderTrackingModel } from '../models/BaleOrderTracking';
import { toObjectIds } from '../utils/mongoIds';
import type { Types } from 'mongoose';

export type BaleOrderTrackingInput = {
  date: Date;
  bale: Types.ObjectId;
  customer: Types.ObjectId;
  quantity: number;
  pricePerTon: number;
  pricePerUnit: number;
  weight?: number | null;
  transportPrice?: number | null;
  weighed?: boolean;
  notes?: string;
};

const balePopulate = { path: 'bale', select: '_id name pricePerTon pricePerUnit' };
const customerPopulate = { path: 'customer', select: '_id name' };

export const baleOrderTrackingRepository = {
  findAll() {
    return BaleOrderTrackingModel.find()
      .populate(balePopulate)
      .populate(customerPopulate)
      .sort({ date: -1 })
      .lean();
  },

  findById(id: string) {
    return BaleOrderTrackingModel.findById(id)
      .populate(balePopulate)
      .populate(customerPopulate)
      .lean();
  },

  create(data: BaleOrderTrackingInput) {
    return BaleOrderTrackingModel.create(data);
  },

  update(id: string, data: Partial<BaleOrderTrackingInput>) {
    return BaleOrderTrackingModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate(balePopulate)
      .populate(customerPopulate)
      .lean();
  },

  delete(id: string) {
    return BaleOrderTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return BaleOrderTrackingModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: BaleOrderTrackingInput[]) {
    return BaleOrderTrackingModel.insertMany(rows);
  },

  deleteAll() {
    return BaleOrderTrackingModel.deleteMany({});
  },
};
