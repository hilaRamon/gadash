import { TractorModel } from '../models/Tractor';
import { toObjectIds } from '../utils/mongoIds';

export type TractorInput = {
  licenseNumber: string;
  name: string;
};

export const tractorRepository = {
  findAll() {
    return TractorModel.find().sort({ name: 1 }).lean();
  },

  findById(id: string) {
    return TractorModel.findById(id).lean();
  },

  create(data: TractorInput) {
    return TractorModel.create(data);
  },

  update(id: string, data: Partial<TractorInput>) {
    return TractorModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  },

  delete(id: string) {
    return TractorModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return TractorModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: TractorInput[]) {
    return TractorModel.insertMany(rows);
  },

  deleteAll() {
    return TractorModel.deleteMany({});
  },
};
