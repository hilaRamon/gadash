import { Schema, model, type InferSchemaType } from 'mongoose';

const supplierSchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

export type SupplierDoc = InferSchemaType<typeof supplierSchema>;

export const SupplierModel = model('Supplier', supplierSchema);
