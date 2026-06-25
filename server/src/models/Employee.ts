import { Schema, model, type InferSchemaType } from 'mongoose';

export const EMPLOYEE_FORMS_OF_PAYMENT = ['שעתי', 'גלובלי'] as const;
export const EMPLOYEE_FORM_OF_PAYMENT_HOURLY = EMPLOYEE_FORMS_OF_PAYMENT[0];
export const EMPLOYEE_FORM_OF_PAYMENT_GLOBAL = EMPLOYEE_FORMS_OF_PAYMENT[1];

export const EMPLOYEE_ROLES = ['employee', 'admin'] as const;
export const EMPLOYEE_ROLE_EMPLOYEE = EMPLOYEE_ROLES[0];
export const EMPLOYEE_ROLE_ADMIN = EMPLOYEE_ROLES[1];

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
    role: {
      type: String,
      enum: EMPLOYEE_ROLES,
      default: EMPLOYEE_ROLE_EMPLOYEE,
    },
  },
  { timestamps: true, versionKey: false },
);

export type EmployeeDoc = InferSchemaType<typeof employeeSchema>;
export type EmployeeFormOfPayment = (typeof EMPLOYEE_FORMS_OF_PAYMENT)[number];
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

export const EmployeeModel = model('Employee', employeeSchema);
