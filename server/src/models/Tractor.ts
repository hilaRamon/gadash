import { Schema, model, type InferSchemaType } from 'mongoose';

const tractorSchema = new Schema(
  {
    licenseNumber: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

export type TractorDoc = InferSchemaType<typeof tractorSchema>;

export const TractorModel = model('Tractor', tractorSchema);
