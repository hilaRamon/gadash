import { Schema, model, type InferSchemaType } from 'mongoose';

export const PRICING_FORMS = ['דונם', 'שעתי', 'כמות יחידות'] as const;
export type PricingForm = (typeof PRICING_FORMS)[number];

export const OPERATION_TYPES = ['עיבוד', 'מנהלה'] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

const costHistoryEntrySchema = new Schema(
  {
    cost: { type: Number, required: true },
    effectiveFrom: { type: Date, required: true },
  },
  { _id: false },
);

const operationSchema = new Schema(
  {
    operationNumber: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    pricingForm: { type: String, required: true, enum: PRICING_FORMS },
    operationType: { type: String, required: true, enum: OPERATION_TYPES },
    currentCost: { type: Number, required: true },
    costHistory: { type: [costHistoryEntrySchema], required: true, default: [] },
  },
  { timestamps: true, versionKey: false },
);

export type OperationDoc = InferSchemaType<typeof operationSchema>;
export type CostHistoryEntry = OperationDoc['costHistory'][number];

export const OperationModel = model('Operation', operationSchema);
