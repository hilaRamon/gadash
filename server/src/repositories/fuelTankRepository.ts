import { FuelTankModel } from '../models/FuelTank';
import { toObjectIds } from '../utils/mongoIds';

export type FuelTankInput = {
  name: string;
  currentAmount: number;
};

export const fuelTankRepository = {
  findAll() {
    return FuelTankModel.find().sort({ name: 1 }).lean();
  },

  findById(id: string) {
    return FuelTankModel.findById(id).lean();
  },

  create(data: FuelTankInput) {
    return FuelTankModel.create(data);
  },

  update(id: string, data: Partial<FuelTankInput>) {
    return FuelTankModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();
  },

  delete(id: string) {
    return FuelTankModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return FuelTankModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: FuelTankInput[]) {
    return FuelTankModel.insertMany(rows);
  },

  deleteAll() {
    return FuelTankModel.deleteMany({});
  },
};
