import { Schema, model, type InferSchemaType } from 'mongoose';

const materialPurchaseTrackingSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

export type MaterialPurchaseTrackingDoc = InferSchemaType<
  typeof materialPurchaseTrackingSchema
>;

export const MaterialPurchaseTrackingModel = model(
  'MaterialPurchaseTracking',
  materialPurchaseTrackingSchema,
);
