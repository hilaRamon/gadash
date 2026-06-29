import { Schema, model, type InferSchemaType } from 'mongoose';

export const TRANSPORT_BILLING_TYPES = [
  'לא לחיוב',
  'חיוב ללקוח',
  'חיוב גלובלי',
] as const;
export type TransportBillingType = (typeof TRANSPORT_BILLING_TYPES)[number];
export const DEFAULT_TRANSPORT_BILLING: TransportBillingType = 'חיוב גלובלי';
export const TRANSPORT_CUSTOMER_BILLING: TransportBillingType = 'חיוב ללקוח';

const transportTrackingSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    mover: { type: Schema.Types.ObjectId, ref: 'Mover', required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    hours: { type: Number, required: true, min: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    billing: {
      type: String,
      required: true,
      enum: TRANSPORT_BILLING_TYPES,
      default: DEFAULT_TRANSPORT_BILLING,
    },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    notes: { type: String, default: '' },
    wasCharged: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export type TransportTrackingDoc = InferSchemaType<typeof transportTrackingSchema>;

export const TransportTrackingModel = model('TransportTracking', transportTrackingSchema);
