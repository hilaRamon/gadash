import { utils, writeFile } from 'xlsx'
import type { CollectionSchema, CollectionDocument } from '../schema/types'
import { formatCell } from './tableQuery'

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^\w\u0590-\u05FF-]+/g, '_').replace(/_+/g, '_')
}

export function exportCollectionToExcel(
  schema: CollectionSchema,
  rows: CollectionDocument[],
): void {
  const headers = schema.columns.map((col) => col.label)
  const data = rows.map((row) =>
    schema.columns.map((col) => formatCell(row, col)),
  )

  const worksheet = utils.aoa_to_sheet([headers, ...data])
  const workbook = utils.book_new()
  workbook.Workbook = { Views: [{ RTL: true }] }
  const sheetName = schema.label.slice(0, 31) || schema.collection
  utils.book_append_sheet(workbook, worksheet, sheetName)

  const date = new Date().toISOString().slice(0, 10)
  const filename = `${sanitizeFilenamePart(schema.collection)}-${date}.xlsx`
  writeFile(workbook, filename)
}
