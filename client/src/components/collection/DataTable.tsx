import type { CollectionSchema, CollectionDocument } from '../../schema/types'
import type { TableQueryState } from '../../schema/tableQuery'
import { formatCell, getCellValue } from '../../lib/tableQuery'
import { EditIcon, DeleteIcon } from './Icons'
import './Collection.css'

type DataTableProps = {
  schema: CollectionSchema
  rows: CollectionDocument[]
  queryState: TableQueryState
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onColumnSearchChange: (key: string, value: string) => void
  onToggleSelect: (id: string) => void
  onToggleSelectAll: (visibleIds: string[]) => void
  onEdit: (row: CollectionDocument) => void
  onDelete: (row: CollectionDocument) => void
}

export function DataTable({
  schema,
  rows,
  queryState,
  isLoading = false,
  isError = false,
  errorMessage,
  onColumnSearchChange,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}: DataTableProps) {
  const visibleIds = rows.map((r) => r.id)
  const allSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => queryState.selectedIds.includes(id))
  const someSelected = visibleIds.some((id) =>
    queryState.selectedIds.includes(id),
  )

  if (isLoading) {
    return <p className="table-loading">טוען...</p>
  }

  if (isError) {
    return (
      <p className="table-error" role="alert">
        {errorMessage ?? 'שגיאה בטעינת הנתונים'}
      </p>
    )
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table" dir="rtl">
        <thead>
          <tr>
            <th className="col-checkbox" scope="col">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected
                }}
                onChange={() => onToggleSelectAll(visibleIds)}
                aria-label="בחר הכל"
              />
            </th>
            {schema.columns.map((col) => (
              <th key={col.key} scope="col" style={{ width: col.width }}>
                <div>{col.label}</div>
                {col.searchable !== false && (
                  <input
                    type="search"
                    className="search-input"
                    value={queryState.columnSearch[col.key] ?? ''}
                    onChange={(e) =>
                      onColumnSearchChange(col.key, e.target.value)
                    }
                    placeholder="חיפוש..."
                    aria-label={`חיפוש ב${col.label}`}
                  />
                )}
              </th>
            ))}
            <th className="col-actions" scope="col">
              פעולות
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={schema.columns.length + 2}>
                <p className="table-empty">אין פריטים להצגה</p>
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const selected = queryState.selectedIds.includes(row.id)
              return (
                <tr key={row.id} data-selected={selected || undefined}>
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(row.id)}
                      aria-label={`בחר ${formatCell(row, schema.columns[0])}`}
                    />
                  </td>
                  {schema.columns.map((col) => {
                    const value = getCellValue(row, col)
                    return (
                      <td key={col.key} style={{ textAlign: col.align ?? 'start' }}>
                        {col.render ? col.render(value, row) : formatCell(row, col)}
                      </td>
                    )
                  })}
                  <td className="col-actions">
                    <div className="col-actions-inner">
                      <button
                        type="button"
                        className="btn btn-icon"
                        onClick={() => onEdit(row)}
                        aria-label="עריכה"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="btn btn-icon"
                        onClick={() => onDelete(row)}
                        aria-label="מחיקה"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
