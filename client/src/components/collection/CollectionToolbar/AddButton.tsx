import styled from 'styled-components'
import { buttonBase } from './sharedStyles'

/* =========================================================================
 * AddButton
 * The green "הוסף" (add) action that opens the create modal.
 * Equivalent of `.btn.btn-add`.
 * ========================================================================= */

const StyledAddButton = styled.button`
  ${buttonBase};
  min-width: 9rem;
  padding: 0.5rem 1.75rem;
  background: #16a34a;
  border-color: transparent;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 700;

  &:hover:not(:disabled) {
    background: #15803d;
  }
`

type AddButtonProps = {
  onClick: () => void
}

export function AddButton({ onClick }: AddButtonProps) {
  return (
    <StyledAddButton type="button" onClick={onClick}>
      הוסף
    </StyledAddButton>
  )
}
