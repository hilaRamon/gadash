import { utils, writeFile } from 'xlsx';
import type { OperationsSummaryRow } from './operationsSummaryApi';

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^\w\u0590-\u05FF-]+/g, '_').replace(/_+/g, '_');
}

function summaryFilename(season: number): string {
  return `${sanitizeFilenamePart(`סיכום-משימות-עונה-${season}`)}.xlsx`;
}

export function exportOperationsSummaryExcel(
  rows: OperationsSummaryRow[],
  season: number,
): void {
  const headers = [
    'שם הפעולה',
    'צורת תמחור',
    'מחיר',
    'סה"כ כמות',
    'סה"כ חיוב',
  ];

  const data = rows.map((row) => [
    row.operationName,
    row.pricingForm ?? '',
    row.currentCost,
    `${row.totalAmount} ${row.amountUnit}`,
    row.totalCharge,
  ]);

  const worksheet = utils.aoa_to_sheet([headers, ...data]);
  const workbook = utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  utils.book_append_sheet(workbook, worksheet, 'סיכום משימות');

  writeFile(workbook, summaryFilename(season));
}
