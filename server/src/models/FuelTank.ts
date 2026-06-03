import { Schema, model, type InferSchemaType } from 'mongoose';

const fuelTankSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    currentAmount: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

export type FuelTankDoc = InferSchemaType<typeof fuelTankSchema>;

export const FuelTankModel = model('FuelTank', fuelTankSchema);
