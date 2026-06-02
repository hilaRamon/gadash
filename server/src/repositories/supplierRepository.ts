import { SupplierModel } from '../models/Supplier';
import { toObjectIds } from '../utils/mongoIds';

export type SupplierInput = {
  name: string;
  mobile?: string;
  email?: string;
};

export const supplierRepository = {
  findAll() {
    return SupplierModel.find().sort({ name: 1 }).lean();
  },

  findById(id: string) {
    return SupplierModel.findById(id).lean();
  },

  create(data: SupplierInput) {
    return SupplierModel.create(data);
  },

  update(id: string, data: Partial<SupplierInput>) {
    return SupplierModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  },

  delete(id: string) {
    return SupplierModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return SupplierModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: SupplierInput[]) {
    return SupplierModel.insertMany(rows);
  },

  deleteAll() {
    return SupplierModel.deleteMany({});
  },
};
