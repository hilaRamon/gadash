import { Types } from 'mongoose';
import {
  EmployeeModel,
  EMPLOYEE_FORM_OF_PAYMENT_GLOBAL,
  EMPLOYEE_FORM_OF_PAYMENT_HOURLY,
  type EmployeeFormOfPayment,
} from '../models/Employee';
import { employeeMonthlyReportRepository } from '../repositories/employeeMonthlyReportRepository';
import { operationTrackingRepository } from '../repositories/operationTrackingRepository';
import { calculateMonthlyHoursFromTrackings } from '../utils/monthlyHoursCalculation';
import { assertValidMonth, dateToMonthKey, parseMonth } from '../utils/monthRange';

function buildTotalsFromCalculation(calc: ReturnType<typeof calculateMonthlyHoursFromTrackings>) {
  return {
    totalHours: calc.totalHours,
    regularHours: calc.regularHours,
    overtime125Hours: calc.overtime125Hours,
    overtime150Hours: calc.overtime150Hours,
    totalDaysWorked: calc.totalDaysWorked,
  };
}

async function resolveEmployee(employeeId: unknown): Promise<{
  id: string;
  formOfPayment: EmployeeFormOfPayment;
}> {
  const id = String(employeeId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('עובד לא נמצא');
  }
  const employee = await EmployeeModel.findById(id).select('_id formOfPayment').lean();
  if (!employee?._id) {
    throw new Error('עובד לא נמצא');
  }
  return {
    id,
    formOfPayment: employee.formOfPayment ?? EMPLOYEE_FORM_OF_PAYMENT_HOURLY,
  };
}

function isGlobalEmployee(formOfPayment: EmployeeFormOfPayment): boolean {
  return formOfPayment === EMPLOYEE_FORM_OF_PAYMENT_GLOBAL;
}

function assertHourlyEmployee(formOfPayment: EmployeeFormOfPayment): void {
  if (isGlobalEmployee(formOfPayment)) {
    throw new Error('דוח חודשי אינו זמין לעובדים גלובליים');
  }
}

function findHourlyEmployeesByIds(employeeIds: unknown[]) {
  return EmployeeModel.find({
    _id: { $in: employeeIds },
    formOfPayment: EMPLOYEE_FORM_OF_PAYMENT_HOURLY,
  })
    .select('_id name')
    .lean();
}

export const monthlyReportService = {
  async calculateMonthlyReport(employeeId: string, month: string) {
    const validMonth = assertValidMonth(month);
    const employee = await resolveEmployee(employeeId);
    const { startDate, endDate } = parseMonth(validMonth);
    const trackings = await operationTrackingRepository.findByEmployeeAndDateRange(
      employee.id,
      startDate,
      endDate,
    );
    return calculateMonthlyHoursFromTrackings(
      trackings.map((row) => ({
        date: new Date(row.date as Date),
        startTime: String(row.startTime ?? ''),
        endTime: String(row.endTime ?? ''),
      })),
    );
  },

  async getEmployeeReport(employeeId: string, month: string) {
    const validMonth = assertValidMonth(month);
    const employee = await resolveEmployee(employeeId);
    assertHourlyEmployee(employee.formOfPayment);
    const employeeObjectId = employee.id;
    const [calculation, employeeDoc] = await Promise.all([
      this.calculateMonthlyReport(employeeObjectId, validMonth),
      EmployeeModel.findById(employeeObjectId).select('_id name').lean(),
    ]);

    const totals = buildTotalsFromCalculation(calculation);

    return {
      employeeId: employeeObjectId,
      employeeName: String(employeeDoc?.name ?? ''),
      month: validMonth,
      days: calculation.days,
      totals,
    };
  },

  async getMonthSummary(month: string) {
    const validMonth = assertValidMonth(month);
    const { startDate, endDate } = parseMonth(validMonth);
    const employeeIds = await operationTrackingRepository.findDistinctEmployeeIdsInDateRange(
      startDate,
      endDate,
    );
    const hourlyEmployees = await findHourlyEmployeesByIds(employeeIds);

    const rows = await Promise.all(
      hourlyEmployees.map(async (hourlyEmployee) => {
        const employeeId = String(hourlyEmployee._id);
        const calculation = await this.calculateMonthlyReport(employeeId, validMonth);
        const totals = buildTotalsFromCalculation(calculation);

        return {
          employeeId,
          employeeName: String(hourlyEmployee.name ?? ''),
          month: validMonth,
          ...totals,
        };
      }),
    );

    return rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'he'));
  },

  async ensureOpenReport(employeeId: string, date: Date): Promise<void> {
    const employee = await resolveEmployee(employeeId);
    if (isGlobalEmployee(employee.formOfPayment)) return;
    const month = dateToMonthKey(date);
    await employeeMonthlyReportRepository.ensureOpenReport(employee.id, month);
  },
};
