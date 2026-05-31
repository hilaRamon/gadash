import { Schema, model, type InferSchemaType } from 'mongoose';

const baleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    pricePerTon: { type: Number, required: true, default: 0 },
    pricePerUnit: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export type BaleDoc = InferSchemaType<typeof baleSchema>;

export const BaleModel = model('Bale', baleSchema);
