import { Schema, model, type InferSchemaType } from 'mongoose';

export const BILLING_UNITS = ['קג/ליטר'] as const;
export type BillingUnit = (typeof BILLING_UNITS)[number];

const pricingHistoryEntrySchema = new Schema(
  {
    cost: { type: Number, required: true },
    percent: { type: Number, required: true, default: 15 },
    effectiveFrom: { type: Date, required: true },
  },
  { _id: false },
);

const materialSchema = new Schema(
  {
    name: { type: String, required: true },
    billingUnit: { type: String, required: true, enum: BILLING_UNITS },
    currentQuantity: { type: Number, required: true, default: 0 },
    currentBuyingCost: { type: Number, required: true },
    currentSalePercent: { type: Number, required: true, default: 15 },
    pricingHistory: {
      type: [pricingHistoryEntrySchema],
      required: true,
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
);

export type MaterialDoc = InferSchemaType<typeof materialSchema>;
export type MaterialPricingEntry = MaterialDoc['pricingHistory'][number];

export const MaterialModel = model('Material', materialSchema);
