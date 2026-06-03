import { Schema, model, type InferSchemaType } from 'mongoose';

const moverSchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' },
    hourlyRate: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export type MoverDoc = InferSchemaType<typeof moverSchema>;

export const MoverModel = model('Mover', moverSchema);
