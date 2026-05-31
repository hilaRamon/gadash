import { Schema, model, type InferSchemaType } from 'mongoose';

const customerSchema = new Schema(
  {
    customerNumber: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

export type CustomerDoc = InferSchemaType<typeof customerSchema>;

export const CustomerModel = model('Customer', customerSchema);
