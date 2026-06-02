import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import type { CollectionSchema } from '../../../schema/types'
import type { TableQueryState } from '../../../schema/tableQuery'
import { buttonBase, selectControl } from './sharedStyles'

/* =========================================================================
 * SortControl
 * "מיון לפי" button that toggles a popover for picking a sort field and
 * direction. Owns its own open/draft state and closes on outside-click /
 * Escape. Equivalent of `.collection-toolbar-sort` and `.collection-sort-*`.
 * ========================================================================= */

/* --- Anchor wrapper (positions the popper relative to the button) --- */
const SortAnchor = styled.div`
  position: relative;
`

/* --- Trigger button (gets an active style when a sort is applied) --- */
const SortButton = styled.button<{ $active: boolean }>`
  ${buttonBase};
  ${({ $active }) =>
    $active &&
    `
      border-color: var(--accent);
      background: var(--active-bg);
    `}
`

/* --- Floating popover dialog --- */
const SortPopper = styled.div`
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  left: auto;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  min-width: 14rem;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
  direction: rtl;
  text-align: right;
`

const SortLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: right;
`

const SortSelect = styled.select`
  ${selectControl};
  width: 100%;
  text-align: right;
`

const SortActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 0.5rem;
  margin-top: 0.25rem;
`

/* --- Action buttons inside the popper --- */
const PrimaryButton = styled.button`
  ${buttonBase};
  background: var(--accent);
  border-color: transparent;
  color: #0d1114;
  font-weight: 600;

  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }
`

const SecondaryButton = styled.button`
  ${buttonBase};
  background: transparent;
`

type SortControlProps = {
  schema: CollectionSchema
  queryState: TableQueryState
  onSortChange: (field: string, direction: 'asc' | 'desc') => void
}

export function SortControl({
  schema,
  queryState,
  onSortChange,
}: SortControlProps) {
  const sortableColumns = schema.columns.filter((c) => c.sortable !== false)

  const sortAnchorRef = useRef<HTMLDivElement>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const [draftField, setDraftField] = useState('')
  const [draftDirection, setDraftDirection] = useState<'asc' | 'desc'>('asc')

  const activeSort = queryState.sort
  const activeSortLabel = activeSort
    ? sortableColumns.find((c) => c.key === activeSort.field)?.label
    : null

  useEffect(() => {
    if (!sortOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        sortAnchorRef.current &&
        !sortAnchorRef.current.contains(event.target as Node)
      ) {
        setSortOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSortOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [sortOpen])

  const openSortPopper = () => {
    setDraftField(queryState.sort?.field ?? sortableColumns[0]?.key ?? '')
    setDraftDirection(queryState.sort?.direction ?? 'asc')
    setSortOpen((open) => !open)
  }

  const applySort = () => {
    if (draftField) onSortChange(draftField, draftDirection)
    setSortOpen(false)
  }

  const clearSort = () => {
    onSortChange('', 'asc')
    setSortOpen(false)
  }

  return (
    <SortAnchor ref={sortAnchorRef}>
      <SortButton
        type="button"
        $active={Boolean(activeSort)}
        onClick={openSortPopper}
        aria-expanded={sortOpen}
        aria-haspopup="dialog"
      >
        מיון לפי
        {activeSortLabel ? ` · ${activeSortLabel}` : ''}
      </SortButton>

      {sortOpen && (
        <SortPopper role="dialog" aria-label="מיון טבלה" dir="rtl">
          <SortLabel htmlFor="sort-field">מיון לפי</SortLabel>
          <SortSelect
            id="sort-field"
            value={draftField}
            onChange={(e) => setDraftField(e.target.value)}
          >
            <option value="">בחר שדה...</option>
            {sortableColumns.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
              </option>
            ))}
          </SortSelect>

          <SortLabel htmlFor="sort-direction">כיוון</SortLabel>
          <SortSelect
            id="sort-direction"
            value={draftDirection}
            onChange={(e) => setDraftDirection(e.target.value as 'asc' | 'desc')}
            disabled={!draftField}
          >
            <option value="asc">עולה</option>
            <option value="desc">יורד</option>
          </SortSelect>

          <SortActions>
            <PrimaryButton type="button" onClick={applySort} disabled={!draftField}>
              מיין
            </PrimaryButton>
            {activeSort && (
              <SecondaryButton type="button" onClick={clearSort}>
                נקה מיון
              </SecondaryButton>
            )}
          </SortActions>
        </SortPopper>
      )}
    </SortAnchor>
  )
}
