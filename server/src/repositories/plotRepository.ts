import { Types } from 'mongoose';
import { PlotModel } from '../models/Plot';
import type { PlotType } from '../models/Plot';
import { toObjectIds } from '../utils/mongoIds';

export type PlotInput = {
  plotNumber: number;
  name: string;
  customer: Types.ObjectId;
  dunam: number;
  plotType: PlotType | null;
  active: boolean;
};

const customerPopulate = { path: 'customer', select: '_id name customerNumber' };

export const plotRepository = {
  findAll() {
    return PlotModel.find().populate(customerPopulate).sort({ plotNumber: 1 }).lean();
  },

  findById(id: string) {
    return PlotModel.findById(id).populate(customerPopulate).lean();
  },

  create(data: PlotInput) {
    return PlotModel.create(data);
  },

  update(id: string, data: Partial<PlotInput>) {
    return PlotModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate(customerPopulate)
      .lean();
  },

  delete(id: string) {
    return PlotModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return PlotModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: PlotInput[]) {
    return PlotModel.insertMany(rows);
  },

  deleteAll() {
    return PlotModel.deleteMany({});
  },
};
