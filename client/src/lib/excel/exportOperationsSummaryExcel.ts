import { exportExcelRows } from './excelExport';
import type { OperationsSummaryRow } from '@/api/operationsSummaryApi';

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

  exportExcelRows({
    rows: [headers, ...data],
    sheetName: 'סיכום משימות',
    filenameTitle: 'סיכום משימות',
    filenameDetails: ['עונה', season],
  });
}
