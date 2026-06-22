import { Schema, model, type InferSchemaType } from 'mongoose';

const materialUsageTrackingSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    plot: { type: Schema.Types.ObjectId, ref: 'Plot', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    amount: { type: Number, required: true },
    unitPrice: { type: Number, default: null, min: 0 },
    notes: { type: String, default: '' },
    billable: { type: Boolean, required: true, default: true },
    wasCharged: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export type MaterialUsageTrackingDoc = InferSchemaType<typeof materialUsageTrackingSchema>;

export const MaterialUsageTrackingModel = model(
  'MaterialUsageTracking',
  materialUsageTrackingSchema,
);
