import { Schema, model, type InferSchemaType } from 'mongoose';

export const CONTRACTOR_PRICING_FORMS = ['שעתי', 'יומי', 'לפי דונם'] as const;
export type ContractorPricingForm = (typeof CONTRACTOR_PRICING_FORMS)[number];

const contractorTrackingSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    contractor: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true },
    plot: { type: Schema.Types.ObjectId, ref: 'Plot', required: true },
    operation: { type: Schema.Types.ObjectId, ref: 'Operation', required: true },
    pricingForm: {
      type: String,
      required: true,
      enum: CONTRACTOR_PRICING_FORMS,
    },
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
    unitPrice: { type: Number, required: true, min: 0 },
    unitAmount: { type: Number, required: true, min: 0 },
    unitCustomerPrice: { type: Number, default: null, min: 0 },
    notes: { type: String, default: '' },
    wasCharged: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export type ContractorTrackingDoc = InferSchemaType<typeof contractorTrackingSchema>;

export const ContractorTrackingModel = model('ContractorTracking', contractorTrackingSchema);
