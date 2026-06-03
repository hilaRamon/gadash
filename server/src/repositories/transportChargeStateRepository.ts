import {
  TRANSPORT_CHARGE_STATE_KEY,
  TransportChargeStateModel,
} from '../models/TransportChargeState';

export type TransportChargeStateRecord = {
  periodStartDate: Date;
  totalSum: number;
};

export const transportChargeStateRepository = {
  findOne() {
    return TransportChargeStateModel.findOne({ key: TRANSPORT_CHARGE_STATE_KEY }).lean();
  },

  upsert(data: TransportChargeStateRecord) {
    return TransportChargeStateModel.findOneAndUpdate(
      { key: TRANSPORT_CHARGE_STATE_KEY },
      {
        key: TRANSPORT_CHARGE_STATE_KEY,
        periodStartDate: data.periodStartDate,
        totalSum: data.totalSum,
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    ).lean();
  },
};
