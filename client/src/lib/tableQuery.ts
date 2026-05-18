import type { CollectionSchema, CollectionDocument, ColumnDef } from '../schema/types'
import type { TableQueryState } from '../schema/tableQuery'

function getCellValue(row: CollectionDocument, column: ColumnDef): unknown {
  if (column.getValue) return column.getValue(row)
  return row[column.key]
}

function formatCell(row: CollectionDocument, column: ColumnDef): string {
  const value = getCellValue(row, column)
  if (column.format) return column.format(value, row)
  if (value == null) return ''
  if (typeof value === 'boolean') return value ? 'כן' : 'לא'
  return String(value)
}

function matchesColumnSearch(
  row: CollectionDocument,
  column: ColumnDef,
  search: string,
): boolean {
  const haystack = formatCell(row, column).toLowerCase()
  return haystack.includes(search.trim().toLowerCase())
}

function compareValues(
  a: unknown,
  b: unknown,
  type: ColumnDef['type'],
  direction: 'asc' | 'desc',
): number {
  const factor = direction === 'asc' ? 1 : -1

  if (a == null && b == null) return 0
  if (a == null) return factor
  if (b == null) return -factor

  if (type === 'number') {
    return (Number(a) - Number(b)) * factor
  }

  if (type === 'date') {
    return (
      (new Date(String(a)).getTime() - new Date(String(b)).getTime()) * factor
    )
  }

  if (type === 'boolean') {
    return (Number(Boolean(a)) - Number(Boolean(b))) * factor
  }

  return String(a).localeCompare(String(b), 'he') * factor
}

function matchesToolbarFilter(
  row: CollectionDocument,
  column: ColumnDef,
  operator: string,
  filterValue: string | number | boolean,
): boolean {
  const raw = getCellValue(row, column)
  const text = formatCell(row, column).toLowerCase()
  const strVal = String(filterValue).toLowerCase()

  switch (operator) {
    case 'contains':
      return text.includes(strVal)
    case 'equals':
      return text === strVal
    case 'startsWith':
      return text.startsWith(strVal)
    case 'eq':
      if (column.type === 'number') return Number(raw) === Number(filterValue)
      if (column.type === 'date')
        return (
          new Date(String(raw)).toDateString() ===
          new Date(String(filterValue)).toDateString()
        )
      return text === strVal
    case 'gt':
      return Number(raw) > Number(filterValue)
    case 'gte':
      return Number(raw) >= Number(filterValue)
    case 'lt':
      return Number(raw) < Number(filterValue)
    case 'lte':
      return Number(raw) <= Number(filterValue)
    case 'is':
      if (column.type === 'boolean') return Boolean(raw) === Boolean(filterValue)
      return String(raw) === String(filterValue)
    case 'isNot':
      return String(raw) !== String(filterValue)
    default:
      return true
  }
}

export function applyTableQuery(
  rows: CollectionDocument[],
  schema: CollectionSchema,
  state: TableQueryState,
): CollectionDocument[] {
  let result = [...rows]

  for (const column of schema.columns) {
    if (column.searchable === false) continue
    const search = state.columnSearch[column.key]
    if (!search?.trim()) continue
    result = result.filter((row) => matchesColumnSearch(row, column, search))
  }

  if (state.filter) {
    const column = schema.columns.find((c) => c.key === state.filter!.field)
    if (column) {
      result = result.filter((row) =>
        matchesToolbarFilter(
          row,
          column,
          state.filter!.operator,
          state.filter!.value,
        ),
      )
    }
  }

  if (state.sort) {
    const column = schema.columns.find((c) => c.key === state.sort!.field)
    if (column) {
      const { field, direction } = state.sort
      result.sort((a, b) => {
        const aVal = column.getValue ? column.getValue(a) : a[field]
        const bVal = column.getValue ? column.getValue(b) : b[field]
        return compareValues(aVal, bVal, column.type, direction)
      })
    }
  }

  return result
}

export function getFilterOperators(
  type: ColumnDef['type'],
): { value: string; label: string }[] {
  switch (type) {
    case 'number':
    case 'date':
      return [
        { value: 'eq', label: 'שווה ל' },
        { value: 'gt', label: 'גדול מ' },
        { value: 'gte', label: 'גדול או שווה' },
        { value: 'lt', label: 'קטן מ' },
        { value: 'lte', label: 'קטן או שווה' },
      ]
    case 'boolean':
      return [{ value: 'is', label: 'הוא' }]
    case 'enum':
      return [
        { value: 'is', label: 'הוא' },
        { value: 'isNot', label: 'אינו' },
      ]
    default:
      return [
        { value: 'contains', label: 'מכיל' },
        { value: 'equals', label: 'שווה ל' },
        { value: 'startsWith', label: 'מתחיל ב' },
      ]
  }
}

export { formatCell, getCellValue }
