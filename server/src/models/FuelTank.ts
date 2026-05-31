import { Schema, model, type InferSchemaType } from 'mongoose';

const fuelTankSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true, versionKey: false },
);

export type FuelTankDoc = InferSchemaType<typeof fuelTankSchema>;

export const FuelTankModel = model('FuelTank', fuelTankSchema);
