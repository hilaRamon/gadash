import { Schema, model, type InferSchemaType } from 'mongoose';

const transportTrackingSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    mover: { type: Schema.Types.ObjectId, ref: 'Mover', required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    hours: { type: Number, required: true, min: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

export type TransportTrackingDoc = InferSchemaType<typeof transportTrackingSchema>;

export const TransportTrackingModel = model('TransportTracking', transportTrackingSchema);
