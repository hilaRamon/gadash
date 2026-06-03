import { Types } from 'mongoose';
import { MaterialPurchaseTrackingModel } from '../models/MaterialPurchaseTracking';
import { toObjectIds } from '../utils/mongoIds';

export type MaterialPurchaseTrackingInput = {
  date: Date;
  material: Types.ObjectId;
  supplier: Types.ObjectId;
  unitPrice: number;
  amount: number;
  finalPrice: number;
  notes?: string;
};

const materialPopulate = { path: 'material', select: '_id name' };
const supplierPopulate = { path: 'supplier', select: '_id name' };

export const materialPurchaseTrackingRepository = {
  findAll() {
    return MaterialPurchaseTrackingModel.find()
      .populate(materialPopulate)
      .populate(supplierPopulate)
      .sort({ date: -1 })
      .lean();
  },

  findById(id: string) {
    return MaterialPurchaseTrackingModel.findById(id)
      .populate(materialPopulate)
      .populate(supplierPopulate)
      .lean();
  },

  create(data: MaterialPurchaseTrackingInput) {
    return MaterialPurchaseTrackingModel.create(data);
  },

  update(id: string, data: Partial<MaterialPurchaseTrackingInput>) {
    return MaterialPurchaseTrackingModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate(materialPopulate)
      .populate(supplierPopulate)
      .lean();
  },

  delete(id: string) {
    return MaterialPurchaseTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return MaterialPurchaseTrackingModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: MaterialPurchaseTrackingInput[]) {
    return MaterialPurchaseTrackingModel.insertMany(rows);
  },

  deleteAll() {
    return MaterialPurchaseTrackingModel.deleteMany({});
  },
};
