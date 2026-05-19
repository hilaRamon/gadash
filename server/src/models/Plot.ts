import { Schema, model, type InferSchemaType } from 'mongoose';

export const PLOT_TYPES = ['הר', 'בקעה'] as const;
export type PlotType = (typeof PLOT_TYPES)[number];

const plotSchema = new Schema(
  {
    plotNumber: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    dunam: { type: Number, required: true },
    plotType: { type: String, default: null },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, versionKey: false },
);

export type PlotDoc = InferSchemaType<typeof plotSchema>;

export const PlotModel = model('Plot', plotSchema);
