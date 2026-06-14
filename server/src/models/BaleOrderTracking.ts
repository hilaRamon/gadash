import { Schema, model, type InferSchemaType } from 'mongoose';

export const BALE_ORDER_PRICING_FORMS = ['לפי משקל', 'לפי יחידות'] as const;
export type BaleOrderPricingForm = (typeof BALE_ORDER_PRICING_FORMS)[number];

const baleOrderTrackingSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    bale: { type: Schema.Types.ObjectId, ref: 'Bale', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    quantity: { type: Number, required: true, min: 0 },
    pricingForm: {
      type: String,
      enum: BALE_ORDER_PRICING_FORMS,
      required: true,
    },
    pricePerTon: { type: Number, required: true, min: 0 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    weight: { type: Number, default: null },
    transportPrice: { type: Number, default: null },
    weighed: { type: Boolean, default: false },
    wasCharged: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

baleOrderTrackingSchema.index({ date: -1 });

export type BaleOrderTrackingDoc = InferSchemaType<typeof baleOrderTrackingSchema>;

export const BaleOrderTrackingModel = model('BaleOrderTracking', baleOrderTrackingSchema);
