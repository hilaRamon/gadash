import { Schema, model, type InferSchemaType } from 'mongoose';

const transportGlobalChargeSchema = new Schema(
  {
    seasonYear: { type: Number, required: true, min: 2000 },
    executedAt: { type: Date, required: true, default: Date.now },
    transportTotal: { type: Number, required: true, min: 0 },
    totalDunam: { type: Number, required: true, min: 0 },
    pricePerDunam: { type: Number, required: true, min: 0 },
    transportTrackingIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'TransportTracking' }],
      default: [],
    },
    customerBillingIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'CustomerBillingTracking' }],
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
);

transportGlobalChargeSchema.index({ seasonYear: 1, executedAt: -1 });

export type TransportGlobalChargeDoc = InferSchemaType<
  typeof transportGlobalChargeSchema
>;

export const TransportGlobalChargeModel = model(
  'TransportGlobalCharge',
  transportGlobalChargeSchema,
);
