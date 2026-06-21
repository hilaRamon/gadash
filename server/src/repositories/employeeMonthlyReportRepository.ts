import { Types } from 'mongoose';
import { EmployeeMonthlyReportModel } from '../models/EmployeeMonthlyReport';

export type AbsenceDaysInput = {
  sickDays?: number;
  vacationDays?: number;
  reserveDays?: number;
};

export type MonthlyReportSnapshot = {
  totalHours: number;
  regularHours: number;
  overtime125Hours: number;
  overtime150Hours: number;
  totalDaysWorked: number;
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

  isMonthClosed(employeeId: string, month: string) {
    return EmployeeMonthlyReportModel.findOne({
      employee: new Types.ObjectId(employeeId),
      month,
      status: 'closed',
    })
      .select('_id')
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

  upsertOpenAbsence(
    employeeId: string,
    month: string,
    fields: Required<AbsenceDaysInput>,
  ) {
    return EmployeeMonthlyReportModel.findOneAndUpdate(
      {
        employee: new Types.ObjectId(employeeId),
        month,
        status: 'open',
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

  closeReport(
    employeeId: string,
    month: string,
    snapshot: MonthlyReportSnapshot,
    absence: Required<AbsenceDaysInput>,
  ) {
    return EmployeeMonthlyReportModel.findOneAndUpdate(
      { employee: new Types.ObjectId(employeeId), month },
      {
        $set: {
          ...snapshot,
          sickDays: absence.sickDays,
          vacationDays: absence.vacationDays,
          reserveDays: absence.reserveDays,
          status: 'closed',
          lockedAt: new Date(),
        },
        $setOnInsert: {
          employee: new Types.ObjectId(employeeId),
          month,
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    )
      .populate(employeePopulate)
      .lean();
  },
};
