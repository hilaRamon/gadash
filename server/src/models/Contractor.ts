import { Schema, model, type InferSchemaType } from 'mongoose';

const contractorSchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

export type ContractorDoc = InferSchemaType<typeof contractorSchema>;

export const ContractorModel = model('Contractor', contractorSchema);
