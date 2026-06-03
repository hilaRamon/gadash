import { useState, type ChangeEvent } from 'react'
import styled, { css } from 'styled-components'
import type {
  CollectionDocument,
  ColumnDef,
  FormSchema,
} from '../../../schema/types'
import {
  ENUM_NULL_FILTER,
  getCellValue,
  getDiscreteColumnOptions,
  parseEnumSelectValue,
} from '../../../lib/tableQuery'
import { CellSavingIndicator } from './CellSavingIndicator'

const CellEditableWrap = styled.span`
  position: relative;
  display: block;
  width: 100%;
`

const CellSelect = styled.select<{ $saving?: boolean }>`
  width: 100%;
  min-width: 0;
  padding: 0.15rem 0.35rem;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: inherit;
  cursor: pointer;
  appearance: none;

  &:hover {
    border-color: var(--border-color);
    background-color: var(--page-bg);
  }

  &:focus,
  &:focus-visible {
    border-color: transparent;
    outline: none;
    box-shadow: none;
    background-color: transparent;
  }

  ${({ $saving }) =>
    $saving &&
    css`
      opacity: 0.5;
      cursor: wait;
    `}
`

function toSelectValue(column: ColumnDef, value: unknown): string {
  if (column.type === 'boolean') return String(Boolean(value))
  if (value == null || value === '') return ''
  return String(value)
}

type EditableDiscreteCellProps = {
  column: ColumnDef
  form: FormSchema
  row: CollectionDocument
  onChange: (value: unknown) => void | Promise<void>
}

export function EditableDiscreteCell({
  column,
  form,
  row,
  onChange,
}: EditableDiscreteCellProps) {
  const serverValue = getCellValue(row, column)
  const serverSelectValue = toSelectValue(column, serverValue)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingSelectValue, setPendingSelectValue] = useState<string | null>(
    null,
  )
  const options = getDiscreteColumnOptions(column, form)
  const selectValue = pendingSelectValue ?? serverSelectValue

  const handleChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const next = parseEnumSelectValue(column, e.target.value, form)
    const nextSelectValue = toSelectValue(column, next)

    if (nextSelectValue === serverSelectValue) return

    setPendingSelectValue(nextSelectValue)
    setIsSaving(true)
    try {
      await onChange(next)
    } catch {
      setPendingSelectValue(null)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <CellEditableWrap aria-busy={isSaving}>
      <CellSelect
        $saving={isSaving}
        value={selectValue}
        disabled={isSaving}
        onChange={handleChange}
        aria-label={`עריכת ${column.label}`}
        aria-live="polite"
      >
        {options.map((opt) => (
          <option key={opt.value || ENUM_NULL_FILTER} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </CellSelect>
      {isSaving && <CellSavingIndicator />}
    </CellEditableWrap>
  )
}
