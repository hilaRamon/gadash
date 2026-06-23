import { Types } from 'mongoose';
import { FuelOperationTrackingModel } from '../models/FuelOperationTracking';
import { toObjectIds } from '../utils/mongoIds';
import { buildSeasonDateQuery } from '../utils/seasonRange';

export type FuelOperationTrackingInput = {
  date: Date;
  operation: Types.ObjectId;
  fuelTank: Types.ObjectId;
  amount: number;
  tractor?: Types.ObjectId | null;
  employee?: Types.ObjectId | null;
  notes?: string;
};

const operationPopulate = {
  path: 'operation',
  select: '_id name operationType',
};
const fuelTankPopulate = { path: 'fuelTank', select: '_id name currentAmount' };
const employeePopulate = { path: 'employee', select: '_id name' };
const tractorPopulate = { path: 'tractor', select: '_id name' };

export const fuelOperationTrackingRepository = {
  findAll(seasonYear?: number) {
    const filter = seasonYear != null ? buildSeasonDateQuery(seasonYear) : {};
    return FuelOperationTrackingModel.find(filter)
      .populate(operationPopulate)
      .populate(fuelTankPopulate)
      .populate(employeePopulate)
      .populate(tractorPopulate)
      .sort({ date: -1 })
      .lean();
  },

  findById(id: string) {
    return FuelOperationTrackingModel.findById(id)
      .populate(operationPopulate)
      .populate(fuelTankPopulate)
      .populate(employeePopulate)
      .populate(tractorPopulate)
      .lean();
  },

  create(data: FuelOperationTrackingInput) {
    return FuelOperationTrackingModel.create(data);
  },

  update(id: string, data: Partial<FuelOperationTrackingInput>) {
    return FuelOperationTrackingModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate(operationPopulate)
      .populate(fuelTankPopulate)
      .populate(employeePopulate)
      .populate(tractorPopulate)
      .lean();
  },

  delete(id: string) {
    return FuelOperationTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return FuelOperationTrackingModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },
};
