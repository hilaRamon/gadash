import { Schema, model, type InferSchemaType } from 'mongoose';

const transportGlobalAllocationSchema = new Schema(
  {
    globalTransportChargeId: {
      type: Schema.Types.ObjectId,
      ref: 'TransportGlobalCharge',
      required: true,
    },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    dunam: { type: Number, required: true, min: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    wasCharged: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

transportGlobalAllocationSchema.index({ customer: 1, wasCharged: 1 });
transportGlobalAllocationSchema.index({ globalTransportChargeId: 1 });

export type TransportGlobalAllocationDoc = InferSchemaType<
  typeof transportGlobalAllocationSchema
>;

export const TransportGlobalAllocationModel = model(
  'TransportGlobalAllocation',
  transportGlobalAllocationSchema,
);
