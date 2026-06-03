import { ContractorModel } from '../models/Contractor';
import { toObjectIds } from '../utils/mongoIds';

export type ContractorInput = {
  name: string;
  mobile?: string;
  email?: string;
  notes?: string;
};

export const contractorRepository = {
  findAll() {
    return ContractorModel.find().sort({ name: 1 }).lean();
  },

  findById(id: string) {
    return ContractorModel.findById(id).lean();
  },

  create(data: ContractorInput) {
    return ContractorModel.create(data);
  },

  update(id: string, data: Partial<ContractorInput>) {
    return ContractorModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();
  },

  delete(id: string) {
    return ContractorModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return ContractorModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: ContractorInput[]) {
    return ContractorModel.insertMany(rows);
  },

  deleteAll() {
    return ContractorModel.deleteMany({});
  },
};
