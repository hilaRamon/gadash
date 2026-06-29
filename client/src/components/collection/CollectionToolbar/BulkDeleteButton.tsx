import styled from 'styled-components'
import { buttonBase, buttonError } from './sharedStyles'

/* =========================================================================
 * BulkDeleteButton
 * Shown only when rows are selected; deletes all selected rows.
 * Equivalent of `.btn.btn-danger`.
 * ========================================================================= */

const StyledBulkDeleteButton = styled.button`
  ${buttonBase};
  ${buttonError};
  flex-shrink: 0;
  white-space: nowrap;
`

type BulkDeleteButtonProps = {
  selectedCount: number
  isDeleting?: boolean
  onClick: () => void
}

export function BulkDeleteButton({
  selectedCount,
  isDeleting = false,
  onClick,
}: BulkDeleteButtonProps) {
  if (selectedCount <= 0) return null

  return (
    <StyledBulkDeleteButton type="button" onClick={onClick} disabled={isDeleting}>
      מחק נבחרים ({selectedCount})
    </StyledBulkDeleteButton>
  )
}
