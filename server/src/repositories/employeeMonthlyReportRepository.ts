import { Types } from 'mongoose';
import { EmployeeMonthlyReportModel } from '../models/EmployeeMonthlyReport';

export type AbsenceDaysInput = {
  sickDays?: number;
  vacationDays?: number;
  reserveDays?: number;
};

const employeePopulate = { path: 'employee', select: '_id name' };

export const employeeMonthlyReportRepository = {
  findByEmployeeAndMonth(employeeId: string, month: string) {
    return EmployeeMonthlyReportModel.findOne({
      employee: new Types.ObjectId(employeeId),
      month,
    })
      .populate(employeePopulate)
      .lean();
  },

  findByMonth(month: string) {
    return EmployeeMonthlyReportModel.find({ month })
      .populate(employeePopulate)
      .lean();
  },

  ensureOpenReport(employeeId: string, month: string) {
    return EmployeeMonthlyReportModel.findOneAndUpdate(
      {
        employee: new Types.ObjectId(employeeId),
        month,
      },
      {
        $setOnInsert: {
          employee: new Types.ObjectId(employeeId),
          month,
          status: 'open',
          totalHours: 0,
          regularHours: 0,
          overtime125Hours: 0,
          overtime150Hours: 0,
          totalDaysWorked: 0,
          sickDays: 0,
          vacationDays: 0,
          reserveDays: 0,
          lockedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).lean();
  },

  upsertAbsence(
    employeeId: string,
    month: string,
    fields: Required<AbsenceDaysInput>,
  ) {
    return EmployeeMonthlyReportModel.findOneAndUpdate(
      {
        employee: new Types.ObjectId(employeeId),
        month,
      },
      {
        $set: {
          sickDays: fields.sickDays,
          vacationDays: fields.vacationDays,
          reserveDays: fields.reserveDays,
        },
        $setOnInsert: {
          employee: new Types.ObjectId(employeeId),
          month,
          status: 'open',
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    )
      .populate(employeePopulate)
      .lean();
  },
};
