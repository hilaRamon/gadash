import styled from 'styled-components'
import type { ColumnDef, FormSchema } from '../../../schema/types'
import {
  ENUM_NULL_FILTER,
  ENUM_NULL_LABEL,
  enumAllowsNull,
  getDiscreteColumnOptions,
  isDiscreteColumn,
} from '../../../lib/tableQuery'
import { focusRing } from './sharedStyles'

const FilterSearchInput = styled.input`
  width: 100%;
  min-width: 4rem;
  margin-top: 0;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--page-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.75rem;
  ${focusRing};
`

const FilterSelect = styled.select`
  width: 100%;
  min-width: 4rem;
  margin-top: 0;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--page-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  ${focusRing};
`

type ColumnFilterControlProps = {
  column: ColumnDef
  form: FormSchema
  value: string
  onChange: (value: string) => void
}

export function ColumnFilterControl({
  column,
  form,
  value,
  onChange,
}: ColumnFilterControlProps) {
  if (!isDiscreteColumn(column)) {
    return (
      <FilterSearchInput
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="חיפוש..."
        aria-label={`חיפוש ב${column.label}`}
      />
    )
  }

  return (
    <FilterSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`סינון ב${column.label}`}
    >
      <option value="">הכל</option>
      {column.type === 'enum' ? (
        <>
          {enumAllowsNull(column, form) && (
            <option value={ENUM_NULL_FILTER}>{ENUM_NULL_LABEL}</option>
          )}
          {(column.enumOptions ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </>
      ) : (
        getDiscreteColumnOptions(column, form).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))
      )}
    </FilterSelect>
  )
}
