import { Types } from 'mongoose';
import { PlotModel } from '../models/Plot';
import type { PlotType } from '../models/Plot';
import type { ListQuery } from '../utils/listQuery';
import { listPaginatedDocuments } from '../utils/listPaginatedDocuments';
import { toObjectIds } from '../utils/mongoIds';

export type PlotInput = {
  name: string;
  customer: Types.ObjectId;
  dunam: number;
  plotType: PlotType | null;
  active: boolean;
};

const customerPopulate = { path: 'customer', select: '_id name' };

export const plotRepository = {
  findAll() {
    return PlotModel.find().populate(customerPopulate).sort({ name: 1 }).lean();
  },

  findPaginated(listQuery: ListQuery) {
    return listPaginatedDocuments('plots', PlotModel, listQuery, customerPopulate);
  },

  findById(id: string, session?: unknown) {
    const query = PlotModel.findById(id).populate(customerPopulate);
    if (session) query.session(session as never);
    return query.lean();
  },

  create(data: PlotInput) {
    return PlotModel.create(data);
  },

  update(id: string, data: Partial<PlotInput>, session?: unknown) {
    return PlotModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
      ...(session ? { session: session as never } : {}),
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
