import {
  EmployeeModel,
  type EmployeeFormOfPayment,
  type EmployeeRole,
} from '../models/Employee';
import { toObjectIds } from '../utils/mongoIds';

export type EmployeeInput = {
  name: string;
  email?: string;
  mobile?: string;
  notes?: string;
  formOfPayment?: EmployeeFormOfPayment;
  role?: EmployeeRole;
};

export const employeeRepository = {
  findAll() {
    return EmployeeModel.find().sort({ name: 1 }).lean();
  },

  findById(id: string) {
    return EmployeeModel.findById(id).lean();
  },

  create(data: EmployeeInput) {
    return EmployeeModel.create(data);
  },

  update(id: string, data: Partial<EmployeeInput>) {
    return EmployeeModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();
  },

  delete(id: string) {
    return EmployeeModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return EmployeeModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: EmployeeInput[]) {
    return EmployeeModel.insertMany(rows);
  },

  deleteAll() {
    return EmployeeModel.deleteMany({});
  },
};
