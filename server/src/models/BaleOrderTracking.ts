import { Schema, model, type InferSchemaType } from 'mongoose';

const baleOrderTrackingSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    bale: { type: Schema.Types.ObjectId, ref: 'Bale', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    location: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    pricePerTon: { type: Number, required: true, min: 0 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    weight: { type: Number, default: null },
    transport: { type: String, default: '' },
    transportPrice: { type: Number, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

baleOrderTrackingSchema.index({ date: -1 });

export type BaleOrderTrackingDoc = InferSchemaType<typeof baleOrderTrackingSchema>;

export const BaleOrderTrackingModel = model('BaleOrderTracking', baleOrderTrackingSchema);
