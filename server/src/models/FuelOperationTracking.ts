import { Schema, model, type InferSchemaType } from 'mongoose';

const fuelOperationTrackingSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    operation: { type: Schema.Types.ObjectId, ref: 'Operation', required: true },
    fuelTank: { type: Schema.Types.ObjectId, ref: 'FuelTank', required: true },
    amount: { type: Number, required: true, min: 0 },
    tractor: { type: Schema.Types.ObjectId, ref: 'Tractor', default: null },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

fuelOperationTrackingSchema.index({ date: -1 });
fuelOperationTrackingSchema.index({ fuelTank: 1, date: -1 });

export type FuelOperationTrackingDoc = InferSchemaType<typeof fuelOperationTrackingSchema>;

export const FuelOperationTrackingModel = model(
  'FuelOperationTracking',
  fuelOperationTrackingSchema,
);
