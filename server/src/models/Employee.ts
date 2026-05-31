import { Schema, model, type InferSchemaType } from 'mongoose';

const employeeSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    mobile: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

export type EmployeeDoc = InferSchemaType<typeof employeeSchema>;

export const EmployeeModel = model('Employee', employeeSchema);
