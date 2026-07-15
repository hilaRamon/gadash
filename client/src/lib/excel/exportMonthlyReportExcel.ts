import { exportExcelRows } from "./excelExport";
import type {
  EmployeeMonthlyReport,
  MonthlySummaryRow,
} from "../monthlyReportApi";
import {
  formatHours,
  formatReportDate,
  formatReportMonth,
  statusLabel,
} from "../monthlyReportApi";

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

  exportExcelRows({
    rows: [headers, ...data],
    sheetName: "סיכום חודשי",
    filenameTitle: "סיכום חודשי",
    filenameDetails: [month],
  });
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

  exportExcelRows({
    rows,
    sheetName: "דוח חודשי",
    filenameTitle: "דוח חודשי",
    filenameDetails: [report.employeeName || "עובד", report.month],
  });
}
