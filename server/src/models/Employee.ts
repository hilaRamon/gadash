import { Schema, model, type InferSchemaType } from 'mongoose';

export const EMPLOYEE_FORMS_OF_PAYMENT = ['שעתי', 'גלובלי'] as const;
export const EMPLOYEE_FORM_OF_PAYMENT_HOURLY = EMPLOYEE_FORMS_OF_PAYMENT[0];
export const EMPLOYEE_FORM_OF_PAYMENT_GLOBAL = EMPLOYEE_FORMS_OF_PAYMENT[1];

const employeeSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    mobile: { type: String, default: '' },
    notes: { type: String, default: '' },
    formOfPayment: {
      type: String,
      enum: EMPLOYEE_FORMS_OF_PAYMENT,
      default: EMPLOYEE_FORM_OF_PAYMENT_HOURLY,
    },
  },
  { timestamps: true, versionKey: false },
);

export type EmployeeDoc = InferSchemaType<typeof employeeSchema>;
export type EmployeeFormOfPayment = (typeof EMPLOYEE_FORMS_OF_PAYMENT)[number];

export const EmployeeModel = model('Employee', employeeSchema);
