import { Types } from 'mongoose';
import { MaterialUsageTrackingModel } from '../models/MaterialUsageTracking';
import { toObjectIds } from '../utils/mongoIds';
import { buildSeasonDateQuery } from '../utils/seasonRange';

export type MaterialUsageTrackingInput = {
  date: Date;
  material: Types.ObjectId;
  plot: Types.ObjectId;
  employee: Types.ObjectId;
  amount: number;
  unitPrice?: number | null;
  notes?: string;
  billable: boolean;
  wasCharged?: boolean;
};

const materialPopulate = {
  path: 'material',
  select: '_id name currentBuyingCost currentSalePercent pricingHistory',
};
const plotPopulate = {
  path: 'plot',
  select: '_id name customer',
  populate: { path: 'customer', select: '_id name' },
};
const employeePopulate = { path: 'employee', select: '_id name' };

export const materialUsageTrackingRepository = {
  findAll(seasonYear?: number) {
    const filter = seasonYear != null ? buildSeasonDateQuery(seasonYear) : {};
    return MaterialUsageTrackingModel.find(filter)
      .populate(materialPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .sort({ date: -1 })
      .lean();
  },

  findById(id: string) {
    return MaterialUsageTrackingModel.findById(id)
      .populate(materialPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .lean();
  },

  create(data: MaterialUsageTrackingInput) {
    return MaterialUsageTrackingModel.create(data);
  },

  update(id: string, data: Partial<MaterialUsageTrackingInput>) {
    return MaterialUsageTrackingModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate(materialPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .lean();
  },

  delete(id: string) {
    return MaterialUsageTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return MaterialUsageTrackingModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: MaterialUsageTrackingInput[]) {
    return MaterialUsageTrackingModel.insertMany(rows);
  },

  deleteAll() {
    return MaterialUsageTrackingModel.deleteMany({});
  },

  markCharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return MaterialUsageTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: true },
    );
  },

  markUncharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return MaterialUsageTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: false },
    );
  },
};
