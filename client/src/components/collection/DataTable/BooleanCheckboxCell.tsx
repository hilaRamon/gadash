import styled from 'styled-components'
import type { CollectionDocument, ColumnDef } from '../../../schema/types'
import { CellSavingIndicator } from './CellSavingIndicator'

const BooleanWrap = styled.span`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1.25rem;
`

const uncheckedIcon = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 3l6 6M9 3L3 9' stroke='white' stroke-width='1.75' stroke-linecap='round'/%3E%3C/svg%3E")`
const checkedIcon = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 6l2.5 2.5 4.5-5' stroke='white' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`

const BooleanCheckbox = styled.input`
  appearance: none;
  width: 1.1rem;
  height: 1.1rem;
  margin: 0;
  border: 2px solid #f56565;
  border-radius: 4px;
  background-color: #f56565;
  background-image: ${uncheckedIcon};
  background-repeat: no-repeat;
  background-position: center;
  background-size: 0.75rem;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;

  &:checked {
    border-color: #48bb78;
    background-color: #48bb78;
    background-image: ${checkedIcon};
  }

  &:hover:not(:disabled):not(:checked) {
    border-color: #fc8181;
    background-color: #fc8181;
  }

  &:hover:not(:disabled):checked {
    border-color: #38a169;
    background-color: #38a169;
  }

  &:focus,
  &:focus-visible {
    outline: none;
  }

  &:focus:not(:checked),
  &:focus-visible:not(:checked) {
    box-shadow: 0 0 0 2px rgba(245, 101, 101, 0.35);
  }

  &:focus:checked,
  &:focus-visible:checked {
    box-shadow: 0 0 0 2px rgba(72, 187, 120, 0.35);
  }

  &:disabled {
    cursor: default;
    opacity: 0.85;
  }
`

function getBooleanLabel(
  column: ColumnDef,
  value: boolean,
  row?: CollectionDocument,
): string {
  if (column.format && row) return column.format(value, row)
  if (column.format) return column.format(value, {} as CollectionDocument)
  return value ? 'כן' : 'לא'
}

type BooleanCheckboxCellProps = {
  column: ColumnDef
  checked: boolean
  row?: CollectionDocument
  isSaving?: boolean
  onChange?: (checked: boolean) => void | Promise<void>
}

export function BooleanCheckboxCell({
  column,
  checked,
  row,
  isSaving = false,
  onChange,
}: BooleanCheckboxCellProps) {
  const label = getBooleanLabel(column, checked, row)

  return (
    <BooleanWrap aria-busy={isSaving} aria-label={isSaving ? `${column.label}: שומר...` : undefined}>
      {isSaving ? (
        <CellSavingIndicator />
      ) : (
        <BooleanCheckbox
          type="checkbox"
          checked={checked}
          disabled={!onChange}
          onChange={
            onChange
              ? (e) => {
                  void onChange(e.target.checked)
                }
              : undefined
          }
          aria-label={`${column.label}: ${label}`}
        />
      )}
    </BooleanWrap>
  )
}
