import { useRef } from 'react'
import styled from 'styled-components'
import type { ColumnDef, FormSchema } from "@/schema/types"
import { formatTableDate } from "@/lib/dateFieldFormat"
import {
  ENUM_NULL_FILTER,
  ENUM_NULL_LABEL,
  enumAllowsNull,
  getDiscreteColumnOptions,
  isDiscreteColumn,
} from "@/lib/tableQuery"
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

const DateFilterWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 0;
  min-width: 100%;
`

const CalendarButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
  margin-top: 0;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--page-bg);
  color: var(--text-secondary);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  box-sizing: border-box;
  ${focusRing};
`

const DateFilterValue = styled.span`
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  white-space: nowrap;
`

const ClearDateButton = styled.button`
  flex: 0 0 auto;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 0.875rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
`

const HiddenDateInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
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

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.5 10h17M8 3.5v3M16 3.5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DateColumnFilter({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => {
    const input = inputRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker()
        return
      } catch {
        input.focus()
      }
    }
    input.focus()
  }

  return (
    <DateFilterWrap>
      {value ? <DateFilterValue>{formatTableDate(value)}</DateFilterValue> : null}
      <CalendarButton
        type="button"
        aria-label={`סינון ב${label}`}
        onClick={openPicker}
      >
        <CalendarIcon />
        {value ? <DateFilterValue>{formatTableDate(value)}</DateFilterValue> : null}
      </CalendarButton>
      {value ? (
        <ClearDateButton
          type="button"
          aria-label="נקה תאריך"
          onClick={() => onChange('')}
        >
          ×
        </ClearDateButton>
      ) : null}
      <HiddenDateInput
        ref={inputRef}
        type="date"
        tabIndex={-1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </DateFilterWrap>
  )
}

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
  if (column.type === 'date') {
    return (
      <DateColumnFilter
        label={column.label}
        value={value}
        onChange={onChange}
      />
    )
  }

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
