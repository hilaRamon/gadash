import { exportExcelRows, toExcelNumber } from "./excelExport";
import type {
  EmployeeMonthlyReport,
  MonthlySummaryRow,
} from "@/api/monthlyReportApi";
import { formatReportDate, formatReportMonth } from "@/api/monthlyReportApi";

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
  ];

  const data = rows.map((row) => [
    row.employeeName,
    row.totalDaysWorked,
    toExcelNumber(row.totalHours),
    toExcelNumber(row.regularHours),
    toExcelNumber(row.overtime125Hours),
    toExcelNumber(row.overtime150Hours),
    row.sickDays,
    row.vacationDays,
    row.reserveDays,
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
  const workingDays = options.workingDaysCount;
  const totals = options.footerTotals;

  const rows: (string | number)[][] = [
    ["עובד", report.employeeName],
    ["חודש", formatReportMonth(report.month)],
    [],
    ["תאריך", 'סה"כ שעות', "שעות רגילות", "שעות נוספות 125%", "שעות נוספות 150%"],
    ...report.days.map((day) => [
      formatReportDate(day.date),
      toExcelNumber(day.totalHours),
      toExcelNumber(day.regularHours),
      toExcelNumber(day.overtime125Hours),
      toExcelNumber(day.overtime150Hours),
    ]),
  ];

  if (report.days.length > 0) {
    rows.push([
      'סה"כ',
      toExcelNumber(totals.totalHours),
      toExcelNumber(totals.regularHours),
      toExcelNumber(totals.overtime125Hours),
      toExcelNumber(totals.overtime150Hours),
    ]);
  }

  rows.push(
    [],
    ["סיכום חודשי"],
    ["ימי עבודה", workingDays],
    ["ימי מחלה", report.absence.sickDays],
    ["ימי חופש", report.absence.vacationDays],
    ["ימי מילואים", report.absence.reserveDays],
    ['סה"כ שעות', toExcelNumber(totals.totalHours)],
    ["שעות רגילות", toExcelNumber(totals.regularHours)],
    ["שעות נוספות 125%", toExcelNumber(totals.overtime125Hours)],
    ["שעות נוספות 150%", toExcelNumber(totals.overtime150Hours)],
  );

  exportExcelRows({
    rows,
    sheetName: "דוח חודשי",
    filenameTitle: "דוח חודשי",
    filenameDetails: [report.employeeName || "עובד", report.month],
  });
}
