import { Types } from 'mongoose';
import { EmployeeMonthlyReportModel } from '../models/EmployeeMonthlyReport';

export const employeeMonthlyReportRepository = {
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
          lockedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).lean();
  },
};
