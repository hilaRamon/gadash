import api from "./api";

export type DailyHoursRow = {
  date: string;
  totalHours: number;
  regularHours: number;
  overtime125Hours: number;
  overtime150Hours: number;
};

export type MonthlyTotals = {
  totalHours: number;
  regularHours: number;
  overtime125Hours: number;
  overtime150Hours: number;
  totalDaysWorked: number;
};

export type AbsenceDays = {
  sickDays: number;
  vacationDays: number;
  reserveDays: number;
};

export type EmployeeMonthlyReport = {
  employeeId: string;
  employeeName: string;
  month: string;
  status: "open" | "closed";
  lockedAt: string | null;
  days: DailyHoursRow[];
  totals: MonthlyTotals;
  absence: AbsenceDays;
};

export type MonthlySummaryRow = {
  employeeId: string;
  employeeName: string;
  month: string;
  status: "open" | "closed";
  totalHours: number;
  regularHours: number;
  overtime125Hours: number;
  overtime150Hours: number;
  totalDaysWorked: number;
  sickDays: number;
  vacationDays: number;
  reserveDays: number;
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function defaultSelectedMonth(): string {
  return currentMonth();
}

export function parseMonthValue(month: string): { year: number; month: number } {
  const [yearStr, monthStr] = month.split("-");
  return {
    year: Number(yearStr),
    month: Number(monthStr),
  };
}

export function buildMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function formatReportMonth(month: string): string {
  const { year, month: monthNum } = parseMonthValue(month);
  if (!Number.isFinite(year) || !Number.isFinite(monthNum) || monthNum < 1) {
    return month;
  }
  return `${monthNum}.${year}`;
}

export function yearOptions(range = 3): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear - range; year <= currentYear + range; year += 1) {
    years.push(year);
  }
  return years;
}

export async function fetchEmployeeMonthlyReport(
  employeeId: string,
  month: string,
): Promise<EmployeeMonthlyReport> {
  const { data } = await api.get<EmployeeMonthlyReport>(
    `/api/monthly-report/${employeeId}/${month}`,
  );
  return data;
}

export async function fetchMonthlySummary(
  month: string,
): Promise<MonthlySummaryRow[]> {
  const { data } = await api.get<{ rows: MonthlySummaryRow[] }>(
    "/api/monthly-report/summary",
    { params: { month } },
  );
  return data.rows;
}

export async function updateMonthlyAbsenceDays(
  employeeId: string,
  month: string,
  absence: AbsenceDays,
): Promise<void> {
  await api.patch(`/api/monthly-report/${employeeId}/${month}/absence`, absence);
}

export async function closeAllEmployeeMonths(month: string): Promise<{
  month: string;
  closedCount: number;
  skippedCount: number;
  total: number;
  rows: MonthlySummaryRow[];
}> {
  const { data } = await api.post<{
    month: string;
    closedCount: number;
    skippedCount: number;
    total: number;
    rows: MonthlySummaryRow[];
  }>("/api/monthly-report/close-all", { month });
  return data;
}

export function formatHours(value: number): string {
  return Number(value).toFixed(2);
}

export function formatReportDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("he-IL");
}

export function statusLabel(status: "open" | "closed"): string {
  return status === "closed" ? "סגור" : "טיוטה (מחושב)";
}
