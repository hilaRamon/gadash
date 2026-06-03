import { Schema, model, type InferSchemaType } from 'mongoose';

export const TRANSPORT_CHARGE_STATE_KEY = 'default';

const transportChargeStateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: TRANSPORT_CHARGE_STATE_KEY },
    periodStartDate: { type: Date, required: true },
    totalSum: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

export type TransportChargeStateDoc = InferSchemaType<typeof transportChargeStateSchema>;

export const TransportChargeStateModel = model(
  'TransportChargeState',
  transportChargeStateSchema,
);
