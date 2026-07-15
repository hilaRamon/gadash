import type { CollectionSchema, CollectionDocument } from "@/schema/types"
import { exportExcelRows } from './excelExport'
import { formatCell } from '../tableQuery'

/** LRM/RLM + directional isolates from RTL number formatters; Excel may show them as [LRI]/[PDI]. */
const BIDI_CONTROLS = /[\u200E\u200F\u2066-\u2069]/g

function stripBidiControls(value: string): string {
  return value.replace(BIDI_CONTROLS, '')
}

export function exportCollectionToExcel(
  schema: CollectionSchema,
  rows: CollectionDocument[],
): void {
  const headers = schema.columns.map((col) => col.label)
  const data = rows.map((row) =>
    schema.columns.map((col) => stripBidiControls(formatCell(row, col))),
  )

  const date = new Date().toISOString().slice(0, 10)
  exportExcelRows({
    rows: [headers, ...data],
    sheetName: schema.label || schema.collection,
    filenameTitle: schema.label,
    filenameDetails: [date],
  })
}
