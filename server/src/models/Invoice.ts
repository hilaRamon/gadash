import { Schema, model, type InferSchemaType } from 'mongoose';

const invoiceSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    invoiceNumber: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, default: null },
    paid: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    fileKey: { type: String, default: null },
    fileName: { type: String, default: null },
    contentType: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

export type InvoiceDoc = InferSchemaType<typeof invoiceSchema>;

export const InvoiceModel = model('Invoice', invoiceSchema);
