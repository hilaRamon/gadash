import { OperationModel } from '../models/Operation';
import type { OperationType, PricingForm } from '../models/Operation';
import { toObjectIds } from '../utils/mongoIds';

export type CostHistoryEntryInput = {
  cost: number;
  effectiveFrom: Date;
};

export type OperationInput = {
  name: string;
  pricingForm: PricingForm;
  operationType: OperationType;
  currentCost: number;
  costHistory: CostHistoryEntryInput[];
};

export type OperationMetadataPatch = Pick<
  OperationInput,
  'name' | 'pricingForm' | 'operationType'
>;

export const operationRepository = {
  findAll() {
    return OperationModel.find().sort({ name: 1 }).lean();
  },

  findById(id: string) {
    return OperationModel.findById(id).lean();
  },

  create(data: OperationInput) {
    return OperationModel.create(data);
  },

  updateMetadata(id: string, data: Partial<OperationMetadataPatch>) {
    return OperationModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  },

  appendCostChange(
    id: string,
    entry: CostHistoryEntryInput,
    currentCost: number,
  ) {
    return OperationModel.findByIdAndUpdate(
      id,
      {
        $push: { costHistory: entry },
        $set: { currentCost },
      },
      { new: true, runValidators: true },
    ).lean();
  },

  delete(id: string) {
    return OperationModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return OperationModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: OperationInput[]) {
    return OperationModel.insertMany(rows);
  },

  deleteAll() {
    return OperationModel.deleteMany({});
  },
};
