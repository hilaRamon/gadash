import type { CollectionSchema, CollectionDocument, ColumnDef } from "@/schema/types"
import { exportExcelRows, toExcelNumber, type ExcelCell } from './excelExport'
import { formatCell, getCellValue } from '../tableQuery'

/** LRM/RLM + directional isolates from RTL number formatters; Excel may show them as [LRI]/[PDI]. */
const BIDI_CONTROLS = /[\u200E\u200F\u2066-\u2069]/g

function stripBidiControls(value: string): string {
  return value.replace(BIDI_CONTROLS, '')
}

function collectionExcelCell(row: CollectionDocument, column: ColumnDef): ExcelCell {
  const display = stripBidiControls(formatCell(row, column))
  if (column.type !== 'number') return display
  if (display === '') return ''
  return toExcelNumber(getCellValue(row, column))
}

export function exportCollectionToExcel(
  schema: CollectionSchema,
  rows: CollectionDocument[],
): void {
  const headers = schema.columns.map((col) => col.label)
  const data = rows.map((row) =>
    schema.columns.map((col) => collectionExcelCell(row, col)),
  )

  const date = new Date().toISOString().slice(0, 10)
  exportExcelRows({
    rows: [headers, ...data],
    sheetName: schema.label || schema.collection,
    filenameTitle: schema.label,
    filenameDetails: [date],
  })
}
