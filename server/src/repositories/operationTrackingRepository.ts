import { Types } from 'mongoose';
import { OperationTrackingModel } from '../models/OperationTracking';
import { toObjectIds } from '../utils/mongoIds';

export type OperationTrackingInput = {
  date: Date;
  operation: Types.ObjectId;
  plot: Types.ObjectId | null;
  employee: Types.ObjectId;
  startTime: string;
  endTime: string;
  notes?: string;
  billable: boolean;
  wasCharged?: boolean;
};

const operationPopulate = {
  path: 'operation',
  select: '_id name operationType currentCost',
};
const plotPopulate = {
  path: 'plot',
  select: '_id name customer dunam',
  populate: { path: 'customer', select: '_id name' },
};
const employeePopulate = { path: 'employee', select: '_id name' };

export const operationTrackingRepository = {
  findAll() {
    return OperationTrackingModel.find()
      .populate(operationPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .sort({ date: -1 })
      .lean();
  },

  findById(id: string) {
    return OperationTrackingModel.findById(id)
      .populate(operationPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .lean();
  },

  create(data: OperationTrackingInput) {
    return OperationTrackingModel.create(data);
  },

  update(id: string, data: Partial<OperationTrackingInput>) {
    return OperationTrackingModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate(operationPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .lean();
  },

  delete(id: string) {
    return OperationTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return OperationTrackingModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  markCharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return OperationTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: true },
    );
  },

  markUncharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return OperationTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: false },
    );
  },
};
