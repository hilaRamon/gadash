import { Types } from 'mongoose';
import {
  CustomerBillingTrackingModel,
  type CustomerBillingStatus,
} from '../models/CustomerBillingTracking';
import { toObjectIds } from '../utils/mongoIds';

export type CustomerBillingTrackingInput = {
  date: Date;
  customer: Types.ObjectId;
  notes?: string;
  status: CustomerBillingStatus;
  paid?: boolean;
  finalPrice: number;
  operationsTrackingIds?: Types.ObjectId[];
  materialUsageTrackingIds?: Types.ObjectId[];
  contractorTrackingIds?: Types.ObjectId[];
  baleOrderTrackingIds?: Types.ObjectId[];
};

const customerPopulate = { path: 'customer', select: '_id name' };

export const customerBillingTrackingRepository = {
  findAll() {
    return CustomerBillingTrackingModel.find()
      .populate(customerPopulate)
      .sort({ date: -1 })
      .lean();
  },

  findById(id: string) {
    return CustomerBillingTrackingModel.findById(id)
      .populate(customerPopulate)
      .lean();
  },

  create(data: CustomerBillingTrackingInput) {
    return CustomerBillingTrackingModel.create(data);
  },

  update(id: string, data: Partial<CustomerBillingTrackingInput>) {
    return CustomerBillingTrackingModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate(customerPopulate)
      .lean();
  },

  delete(id: string) {
    return CustomerBillingTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return CustomerBillingTrackingModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },
};
