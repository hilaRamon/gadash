import { useMemo, useState } from 'react'
import type { CollectionSchema } from '../../schema/types'
import type { TableQueryState } from '../../schema/tableQuery'
import { getFilterOperators } from '../../lib/tableQuery'
import './Collection.css'

type CollectionToolbarProps = {
  schema: CollectionSchema
  queryState: TableQueryState
  selectedCount: number
  isDeleting?: boolean
  onAdd: () => void
  onSortChange: (field: string, direction: 'asc' | 'desc') => void
  onFilterChange: (filter: TableQueryState['filter']) => void
  onBulkDelete: () => void
}

export function CollectionToolbar({
  schema,
  queryState,
  selectedCount,
  isDeleting = false,
  onAdd,
  onSortChange,
  onFilterChange,
  onBulkDelete,
}: CollectionToolbarProps) {
  const sortableColumns = schema.columns.filter((c) => c.sortable !== false)
  const filterableColumns = schema.columns.filter((c) => c.filterable !== false)

  const [filterField, setFilterField] = useState(
    filterableColumns[0]?.key ?? '',
  )
  const [filterOperator, setFilterOperator] = useState('contains')
  const [filterValue, setFilterValue] = useState('')

  const filterColumn = filterableColumns.find((c) => c.key === filterField)
  const operators = useMemo(
    () => (filterColumn ? getFilterOperators(filterColumn.type) : []),
    [filterColumn],
  )

  const sortField = queryState.sort?.field ?? ''
  const sortDirection = queryState.sort?.direction ?? 'asc'

  const applyFilter = () => {
    if (!filterField || !filterValue.trim()) {
      onFilterChange(null)
      return
    }
    const col = filterableColumns.find((c) => c.key === filterField)
    let value: string | number | boolean = filterValue
    if (col?.type === 'number') value = Number(filterValue)
    if (col?.type === 'boolean') value = filterValue === 'true'
    onFilterChange({ field: filterField, operator: filterOperator, value })
  }

  const clearFilter = () => {
    setFilterValue('')
    onFilterChange(null)
  }

  return (
    <div className="collection-toolbar">
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        הוסף
      </button>

      <div className="collection-toolbar-group">
        <label className="visually-hidden" htmlFor="sort-field">
          מיון לפי
        </label>
        <select
          id="sort-field"
          className="select-control"
          value={sortField}
          onChange={(e) => onSortChange(e.target.value, sortDirection)}
        >
          <option value="">מיון לפי...</option>
          {sortableColumns.map((col) => (
            <option key={col.key} value={col.key}>
              {col.label}
            </option>
          ))}
        </select>

        <select
          className="select-control"
          value={sortDirection}
          onChange={(e) =>
            onSortChange(sortField, e.target.value as 'asc' | 'desc')
          }
          disabled={!sortField}
          aria-label="כיוון מיון"
        >
          <option value="asc">עולה</option>
          <option value="desc">יורד</option>
        </select>
      </div>

      <div className="collection-toolbar-group">
        <select
          className="select-control"
          value={filterField}
          onChange={(e) => {
            setFilterField(e.target.value)
            const col = filterableColumns.find((c) => c.key === e.target.value)
            const ops = col ? getFilterOperators(col.type) : []
            setFilterOperator(ops[0]?.value ?? 'contains')
          }}
          aria-label="שדה סינון"
        >
          {filterableColumns.map((col) => (
            <option key={col.key} value={col.key}>
              {col.label}
            </option>
          ))}
        </select>

        <select
          className="select-control"
          value={filterOperator}
          onChange={(e) => setFilterOperator(e.target.value)}
          aria-label="אופרטור סינון"
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>

        {filterColumn?.type === 'boolean' ? (
          <select
            className="select-control"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            aria-label="ערך סינון"
          >
            <option value="">בחר...</option>
            <option value="true">כן</option>
            <option value="false">לא</option>
          </select>
        ) : filterColumn?.type === 'enum' && filterColumn.enumOptions ? (
          <select
            className="select-control"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            aria-label="ערך סינון"
          >
            <option value="">בחר...</option>
            {filterColumn.enumOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={filterColumn?.type === 'number' ? 'number' : 'text'}
            className="select-control"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="ערך..."
            aria-label="ערך סינון"
          />
        )}

        <button type="button" className="btn" onClick={applyFilter}>
          סנן
        </button>
        {queryState.filter && (
          <button type="button" className="btn btn-secondary" onClick={clearFilter}>
            נקה סינון
          </button>
        )}
      </div>

      <div className="collection-toolbar-spacer" />

      {selectedCount > 0 && (
        <button
          type="button"
          className="btn btn-danger"
          onClick={onBulkDelete}
          disabled={isDeleting}
        >
          מחק נבחרים ({selectedCount})
        </button>
      )}
    </div>
  )
}
