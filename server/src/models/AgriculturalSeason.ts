import { Schema, model, type InferSchemaType } from 'mongoose';

const agriculturalSeasonSchema = new Schema(
  {
    year: { type: Number, required: true, unique: true, min: 2000, max: 2099 },
  },
  { timestamps: true, versionKey: false },
);

export type AgriculturalSeasonDoc = InferSchemaType<
  typeof agriculturalSeasonSchema
>;

export const AgriculturalSeasonModel = model(
  'AgriculturalSeason',
  agriculturalSeasonSchema,
);
