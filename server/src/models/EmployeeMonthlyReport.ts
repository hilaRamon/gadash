import { Schema, model, type InferSchemaType } from 'mongoose';

export const MONTHLY_REPORT_STATUSES = ['open', 'closed'] as const;

const employeeMonthlyReportSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: String, required: true, trim: true },
    totalHours: { type: Number, default: 0, min: 0 },
    regularHours: { type: Number, default: 0, min: 0 },
    overtime125Hours: { type: Number, default: 0, min: 0 },
    overtime150Hours: { type: Number, default: 0, min: 0 },
    totalDaysWorked: { type: Number, default: 0, min: 0 },
    sickDays: { type: Number, default: 0, min: 0 },
    vacationDays: { type: Number, default: 0, min: 0 },
    reserveDays: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: MONTHLY_REPORT_STATUSES,
      default: 'open',
    },
    lockedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

employeeMonthlyReportSchema.index({ employee: 1, month: 1 }, { unique: true });
employeeMonthlyReportSchema.index({ month: 1, status: 1 });

export type EmployeeMonthlyReportDoc = InferSchemaType<typeof employeeMonthlyReportSchema>;

export const EmployeeMonthlyReportModel = model(
  'EmployeeMonthlyReport',
  employeeMonthlyReportSchema,
);
