import { MoverModel } from '../models/Mover';
import { toObjectIds } from '../utils/mongoIds';

export type MoverInput = {
  name: string;
  mobile?: string;
  email?: string;
  hourlyRate?: number;
};

export const moverRepository = {
  findAll() {
    return MoverModel.find().sort({ name: 1 }).lean();
  },

  findById(id: string) {
    return MoverModel.findById(id).lean();
  },

  create(data: MoverInput) {
    return MoverModel.create(data);
  },

  update(id: string, data: Partial<MoverInput>) {
    return MoverModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();
  },

  delete(id: string) {
    return MoverModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return MoverModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: MoverInput[]) {
    return MoverModel.insertMany(rows);
  },

  deleteAll() {
    return MoverModel.deleteMany({});
  },
};
