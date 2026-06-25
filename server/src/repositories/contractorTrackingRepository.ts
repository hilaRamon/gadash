import { Types } from 'mongoose';
import { ContractorTrackingModel } from '../models/ContractorTracking';
import type { ContractorPricingForm } from '../models/ContractorTracking';
import { toObjectIds } from '../utils/mongoIds';
import { buildSeasonDateQuery } from '../utils/seasonRange';

export type ContractorTrackingInput = {
  date: Date;
  contractor: Types.ObjectId;
  plot: Types.ObjectId;
  operation: Types.ObjectId;
  pricingForm: ContractorPricingForm;
  startTime: string | null;
  endTime: string | null;
  unitPrice: number;
  unitAmount: number;
  finalPrice: number;
  customerPrice: number | null;
  notes?: string;
  wasCharged?: boolean;
};

const contractorPopulate = { path: 'contractor', select: '_id name' };
const plotPopulate = {
  path: 'plot',
  select: '_id name customer dunam',
  populate: { path: 'customer', select: '_id name' },
};
const operationPopulate = { path: 'operation', select: '_id name' };

export const contractorTrackingRepository = {
  findAll(seasonYear?: number) {
    const filter = seasonYear != null ? buildSeasonDateQuery(seasonYear) : {};
    return ContractorTrackingModel.find(filter)
      .populate(contractorPopulate)
      .populate(plotPopulate)
      .populate(operationPopulate)
      .sort({ date: -1 })
      .lean();
  },

  findById(id: string) {
    return ContractorTrackingModel.findById(id)
      .populate(contractorPopulate)
      .populate(plotPopulate)
      .populate(operationPopulate)
      .lean();
  },

  create(data: ContractorTrackingInput) {
    return ContractorTrackingModel.create(data);
  },

  update(id: string, data: Partial<ContractorTrackingInput>) {
    return ContractorTrackingModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate(contractorPopulate)
      .populate(plotPopulate)
      .populate(operationPopulate)
      .lean();
  },

  delete(id: string) {
    return ContractorTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return ContractorTrackingModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  markCharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return ContractorTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: true },
    );
  },

  markUncharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return ContractorTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: false },
    );
  },
};
