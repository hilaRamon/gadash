import { MaterialModel } from '../models/Material';
import { toObjectIds } from '../utils/mongoIds';

export type MaterialPricingEntryInput = {
  cost: number;
  percent: number;
  effectiveFrom: Date;
};

export type MaterialInput = {
  name: string;
  inventoryGroup?: string | null;
  amountPerDunam?: number | null;
  currentQuantity: number;
  currentBuyingCost: number;
  currentSalePercent: number;
  pricingHistory: MaterialPricingEntryInput[];
};

export type MaterialMetadataPatch = Pick<
  MaterialInput,
  'name' | 'currentQuantity' | 'amountPerDunam' | 'inventoryGroup'
>;

export const materialRepository = {
  findAll() {
    return MaterialModel.find().sort({ name: 1 }).lean();
  },

  findById(id: string) {
    return MaterialModel.findById(id).lean();
  },

  create(data: MaterialInput) {
    return MaterialModel.create(data);
  },

  updateMetadata(id: string, data: Partial<MaterialMetadataPatch>) {
    return MaterialModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();
  },

  appendPricingChange(
    id: string,
    entry: MaterialPricingEntryInput,
    currentBuyingCost: number,
    currentSalePercent: number,
  ) {
    return MaterialModel.findByIdAndUpdate(
      id,
      {
        $push: { pricingHistory: entry },
        $set: { currentBuyingCost, currentSalePercent },
      },
      { returnDocument: 'after', runValidators: true },
    ).lean();
  },

  delete(id: string) {
    return MaterialModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return MaterialModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: MaterialInput[]) {
    return MaterialModel.insertMany(rows);
  },

  deleteAll() {
    return MaterialModel.deleteMany({});
  },
};
