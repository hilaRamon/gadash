import { AgriculturalSeasonModel } from '../models/AgriculturalSeason';
import { toObjectIds } from '../utils/mongoIds';

export type AgriculturalSeasonInput = {
  year: number;
};

export const agriculturalSeasonRepository = {
  findAll() {
    return AgriculturalSeasonModel.find().sort({ year: -1 }).lean();
  },

  findById(id: string) {
    return AgriculturalSeasonModel.findById(id).lean();
  },

  create(data: AgriculturalSeasonInput) {
    return AgriculturalSeasonModel.create(data);
  },

  update(id: string, data: Partial<AgriculturalSeasonInput>) {
    return AgriculturalSeasonModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  },

  delete(id: string) {
    return AgriculturalSeasonModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return AgriculturalSeasonModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: AgriculturalSeasonInput[]) {
    return AgriculturalSeasonModel.insertMany(rows);
  },

  deleteAll() {
    return AgriculturalSeasonModel.deleteMany({});
  },
};
