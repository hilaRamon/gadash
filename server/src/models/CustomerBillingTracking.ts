import { Schema, model, type InferSchemaType } from 'mongoose';

export const CUSTOMER_BILLING_STATUSES = [
  'לא אושר כלל',
  'אושר ע״י לקוח',
  'הופקה חשבונית',
] as const;

export type CustomerBillingStatus = (typeof CUSTOMER_BILLING_STATUSES)[number];

const customerBillingTrackingSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    notes: { type: String, default: '' },
    status: {
      type: String,
      required: true,
      enum: CUSTOMER_BILLING_STATUSES,
      default: 'לא אושר כלל',
    },
    paid: { type: Boolean, default: false },
    finalPrice: { type: Number, required: true, min: 0 },
    operationsTrackingIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'OperationTracking' }],
      default: [],
    },
    materialUsageTrackingIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'MaterialUsageTracking' }],
      default: [],
    },
    contractorTrackingIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'ContractorTracking' }],
      default: [],
    },
    baleOrderTrackingIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'BaleOrderTracking' }],
      default: [],
    },
    transportTrackingIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'TransportTracking' }],
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
);

export type CustomerBillingTrackingDoc = InferSchemaType<
  typeof customerBillingTrackingSchema
>;

export const CustomerBillingTrackingModel = model(
  'CustomerBillingTracking',
  customerBillingTrackingSchema,
);
