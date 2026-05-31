import { CustomerModel } from '../models/Customer';
import { toObjectIds } from '../utils/mongoIds';

export type CustomerInput = {
  customerNumber: number;
  name: string;
  mobile?: string;
  email?: string;
  notes?: string;
};

export const customerRepository = {
  findAll() {
    return CustomerModel.find().sort({ customerNumber: 1 }).lean();
  },

  findById(id: string) {
    return CustomerModel.findById(id).lean();
  },

  findByName(name: string) {
    return CustomerModel.findOne({ name }).select('_id name').lean();
  },

  create(data: CustomerInput) {
    return CustomerModel.create(data);
  },

  update(id: string, data: Partial<CustomerInput>) {
    return CustomerModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  },

  delete(id: string) {
    return CustomerModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return CustomerModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: CustomerInput[]) {
    return CustomerModel.insertMany(rows);
  },

  deleteAll() {
    return CustomerModel.deleteMany({});
  },
};
