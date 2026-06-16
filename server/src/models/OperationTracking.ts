import { Schema, model, type InferSchemaType } from 'mongoose';

const operationTrackingSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    operation: { type: Schema.Types.ObjectId, ref: 'Operation', required: true },
    plot: { type: Schema.Types.ObjectId, ref: 'Plot', default: null },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    notes: { type: String, default: '' },
    billable: { type: Boolean, required: true, default: true },
    wasCharged: { type: Boolean, default: false },
    dunam: { type: Number, default: null, min: 0 },
    unitCost: { type: Number, default: null, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

export type OperationTrackingDoc = InferSchemaType<typeof operationTrackingSchema>;

export const OperationTrackingModel = model('OperationTracking', operationTrackingSchema);
