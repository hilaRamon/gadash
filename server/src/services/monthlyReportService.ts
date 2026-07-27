import { Types } from 'mongoose';
import {
  EmployeeModel,
  EMPLOYEE_FORM_OF_PAYMENT_GLOBAL,
  EMPLOYEE_FORM_OF_PAYMENT_HOURLY,
  type EmployeeFormOfPayment,
} from '../models/Employee';
import {
  employeeMonthlyReportRepository,
  type AbsenceDaysInput,
} from '../repositories/employeeMonthlyReportRepository';
import { operationTrackingRepository } from '../repositories/operationTrackingRepository';
import { calculateMonthlyHoursFromTrackings } from '../utils/monthlyHoursCalculation';
import { assertValidMonth, dateToMonthKey, parseMonth } from '../utils/monthRange';
import { toApiDocument } from '../utils/toApiDocument';

function parseNonNegativeNumber(value: unknown, label: string): number {
  if (value == null || value === '') return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`${label} לא תקין`);
  }
  return num;
}

function parseAbsenceFields(body: Record<string, unknown>): Required<AbsenceDaysInput> {
  return {
    sickDays: parseNonNegativeNumber(body.sickDays, 'ימי מחלה'),
    vacationDays: parseNonNegativeNumber(body.vacationDays, 'ימי חופש'),
    reserveDays: parseNonNegativeNumber(body.reserveDays, 'ימי מילואים'),
  };
}

function getEmployeeName(doc: Record<string, unknown> | null | undefined): string {
  const employee = doc?.employee;
  if (employee && typeof employee === 'object' && employee !== null && 'name' in employee) {
    return String((employee as { name?: unknown }).name ?? '');
  }
  return '';
}

function buildAbsence(report: Record<string, unknown> | null | undefined) {
  return {
    sickDays: Number(report?.sickDays ?? 0),
    vacationDays: Number(report?.vacationDays ?? 0),
    reserveDays: Number(report?.reserveDays ?? 0),
  };
}

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
    const [calculation, report, employeeDoc] = await Promise.all([
      this.calculateMonthlyReport(employeeObjectId, validMonth),
      employeeMonthlyReportRepository.findByEmployeeAndMonth(employeeObjectId, validMonth),
      EmployeeModel.findById(employeeObjectId).select('_id name').lean(),
    ]);

    const absence = buildAbsence(report as Record<string, unknown> | null | undefined);
    const totals = buildTotalsFromCalculation(calculation);

    return {
      employeeId: employeeObjectId,
      employeeName: String(employeeDoc?.name ?? getEmployeeName(report as Record<string, unknown>)),
      month: validMonth,
      days: calculation.days,
      totals,
      absence,
    };
  },

  async getMonthSummary(month: string) {
    const validMonth = assertValidMonth(month);
    const { startDate, endDate } = parseMonth(validMonth);
    const [employeeIds, reports] = await Promise.all([
      operationTrackingRepository.findDistinctEmployeeIdsInDateRange(startDate, endDate),
      employeeMonthlyReportRepository.findByMonth(validMonth),
    ]);
    const hourlyEmployees = await findHourlyEmployeesByIds(employeeIds);

    const employeeNameById = new Map(
      hourlyEmployees.map((row) => [String(row._id), String(row.name ?? '')]),
    );
    const reportByEmployeeId = new Map(
      reports.map((row) => [String(row.employee?._id ?? row.employee), row]),
    );

    const rows = await Promise.all(
      hourlyEmployees.map(async (hourlyEmployee) => {
        const employeeId = String(hourlyEmployee._id);
        const report = reportByEmployeeId.get(employeeId);
        const calculation = await this.calculateMonthlyReport(employeeId, validMonth);
        const totals = buildTotalsFromCalculation(calculation);
        const absence = buildAbsence(report as Record<string, unknown> | null | undefined);

        return {
          employeeId,
          employeeName: employeeNameById.get(employeeId) ?? getEmployeeName(report as Record<string, unknown>),
          month: validMonth,
          ...totals,
          ...absence,
        };
      }),
    );

    return rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'he'));
  },

  async updateAbsenceDays(employeeId: string, month: string, body: Record<string, unknown>) {
    const validMonth = assertValidMonth(month);
    const employee = await resolveEmployee(employeeId);
    assertHourlyEmployee(employee.formOfPayment);
    const employeeObjectId = employee.id;

    const absence = parseAbsenceFields(body);
    const updated = await employeeMonthlyReportRepository.upsertAbsence(
      employeeObjectId,
      validMonth,
      absence,
    );
    if (!updated) {
      throw new Error('לא ניתן לעדכן ימי היעדרות');
    }
    return toApiDocument(updated as Record<string, unknown>);
  },

  async ensureOpenReport(employeeId: string, date: Date): Promise<void> {
    const employee = await resolveEmployee(employeeId);
    if (isGlobalEmployee(employee.formOfPayment)) return;
    const month = dateToMonthKey(date);
    await employeeMonthlyReportRepository.ensureOpenReport(employee.id, month);
  },
};
