import { BaleModel } from '../models/Bale';
import { toObjectIds } from '../utils/mongoIds';

export type BaleInput = {
  name: string;
  pricePerTon: number;
  pricePerUnit: number;
};

export const baleRepository = {
  findAll() {
    return BaleModel.find().sort({ name: 1 }).lean();
  },

  findById(id: string) {
    return BaleModel.findById(id).lean();
  },

  create(data: BaleInput) {
    return BaleModel.create(data);
  },

  update(id: string, data: Partial<BaleInput>) {
    return BaleModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  },

  delete(id: string) {
    return BaleModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return BaleModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: BaleInput[]) {
    return BaleModel.insertMany(rows);
  },

  deleteAll() {
    return BaleModel.deleteMany({});
  },
};
