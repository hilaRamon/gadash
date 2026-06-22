import { utils, writeFile } from "xlsx";
import type {
  EmployeeMonthlyReport,
  MonthlySummaryRow,
} from "./monthlyReportApi";
import {
  formatHours,
  formatReportDate,
  formatReportMonth,
  statusLabel,
} from "./monthlyReportApi";

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^\w\u0590-\u05FF-]+/g, "_").replace(/_+/g, "_");
}

function summaryFilename(month: string): string {
  return `${sanitizeFilenamePart(`סיכום-חודשי-${month}`)}.xlsx`;
}

function employeeReportFilename(employeeName: string, month: string): string {
  const name = sanitizeFilenamePart(employeeName || "עובד");
  return `${sanitizeFilenamePart(`דוח-חודשי-${name}-${month}`)}.xlsx`;
}

export function exportMonthlyReportExcel(
  rows: MonthlySummaryRow[],
  month: string,
): void {
  const headers = [
    "עובד",
    "ימי עבודה",
    'סה"כ שעות',
    "שעות רגילות",
    "שעות נוספות 125%",
    "שעות נוספות 150%",
    "ימי מחלה",
    "ימי חופש",
    "ימי מילואים",
    "סטטוס",
  ];

  const data = rows.map((row) => [
    row.employeeName,
    row.totalDaysWorked,
    formatHours(row.totalHours),
    formatHours(row.regularHours),
    formatHours(row.overtime125Hours),
    formatHours(row.overtime150Hours),
    row.sickDays,
    row.vacationDays,
    row.reserveDays,
    statusLabel(row.status),
  ]);

  const worksheet = utils.aoa_to_sheet([headers, ...data]);
  const workbook = utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  utils.book_append_sheet(workbook, worksheet, "סיכום חודשי");

  writeFile(workbook, summaryFilename(month));
}

export function exportEmployeeMonthlyReportExcel(
  report: EmployeeMonthlyReport,
  options: {
    footerTotals: {
      totalHours: number;
      regularHours: number;
      overtime125Hours: number;
      overtime150Hours: number;
      totalDaysWorked: number;
    };
    workingDaysCount: number;
  },
): void {
  const isClosed = report.status === "closed";
  const workingDays = isClosed
    ? report.totals.totalDaysWorked
    : options.workingDaysCount;
  const totals = options.footerTotals;

  const rows: (string | number)[][] = [
    ["עובד", report.employeeName],
    ["חודש", formatReportMonth(report.month)],
    ["סטטוס", statusLabel(report.status)],
    [],
    ["תאריך", 'סה"כ שעות', "שעות רגילות", "שעות נוספות 125%", "שעות נוספות 150%"],
    ...report.days.map((day) => [
      formatReportDate(day.date),
      formatHours(day.totalHours),
      formatHours(day.regularHours),
      formatHours(day.overtime125Hours),
      formatHours(day.overtime150Hours),
    ]),
  ];

  if (report.days.length > 0) {
    rows.push([
      'סה"כ',
      formatHours(totals.totalHours),
      formatHours(totals.regularHours),
      formatHours(totals.overtime125Hours),
      formatHours(totals.overtime150Hours),
    ]);
  }

  rows.push(
    [],
    ["סיכום חודשי"],
    ["ימי עבודה", workingDays],
    ["ימי מחלה", report.absence.sickDays],
    ["ימי חופש", report.absence.vacationDays],
    ["ימי מילואים", report.absence.reserveDays],
    ['סה"כ שעות', formatHours(totals.totalHours)],
    ["שעות רגילות", formatHours(totals.regularHours)],
    ["שעות נוספות 125%", formatHours(totals.overtime125Hours)],
    ["שעות נוספות 150%", formatHours(totals.overtime150Hours)],
  );

  const worksheet = utils.aoa_to_sheet(rows);
  const workbook = utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  utils.book_append_sheet(workbook, worksheet, "דוח חודשי");

  writeFile(workbook, employeeReportFilename(report.employeeName, report.month));
}
