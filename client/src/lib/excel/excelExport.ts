import { utils, writeFile } from 'xlsx'

const HEBREW = /[\u0590-\u05FF]/
const FILENAME_SAFE = /[^\w\u0590-\u05FF.-]+/g
const DEFAULT_HEBREW_TITLE = 'דוח'

export type ExcelCell = string | number | boolean | null | undefined
export type ExcelRow = ExcelCell[]

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(FILENAME_SAFE, '_')
    .replace(/_+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^[_.-]+|[_.-]+$/g, '')
}

function sanitizeSheetName(value: string): string {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/[\\/?*[\]]/g, '_')
    .slice(0, 31)
  return cleaned || DEFAULT_HEBREW_TITLE
}

/**
 * Builds a download filename whose title is always Hebrew.
 * Dynamic details (dates, seasons, employee names) may include Latin letters.
 */
export function buildExcelFilename(
  hebrewTitle: string,
  ...details: Array<string | number | null | undefined>
): string {
  const title = String(hebrewTitle ?? '').trim()
  const safeTitle = sanitizeFilenamePart(
    HEBREW.test(title) ? title : DEFAULT_HEBREW_TITLE,
  ) || DEFAULT_HEBREW_TITLE

  const safeDetails = details
    .map((detail) => {
      if (detail == null || detail === '') return ''
      return sanitizeFilenamePart(String(detail))
    })
    .filter(Boolean)

  const base = [safeTitle, ...safeDetails].join('-')
  return `${base}.xlsx`
}

export function exportExcelRows(options: {
  rows: ExcelRow[]
  sheetName: string
  filenameTitle: string
  filenameDetails?: Array<string | number | null | undefined>
}): void {
  const { rows, sheetName, filenameTitle, filenameDetails = [] } = options

  const worksheet = utils.aoa_to_sheet(rows)
  const workbook = utils.book_new()
  workbook.Workbook = { Views: [{ RTL: true }] }

  utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheetName))

  writeFile(workbook, buildExcelFilename(filenameTitle, ...filenameDetails))
}
