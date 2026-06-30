import styled from 'styled-components'
import { buttonBase, toolbarButtonAccent } from './sharedStyles'

/* =========================================================================
 * AddButton
 * The green "הוסף" (add) action that opens the create modal.
 * Equivalent of `.btn.btn-add`.
 * ========================================================================= */

const StyledAddButton = styled.button`
  ${buttonBase};
  min-width: 9rem;
  padding: 0.5rem 1.75rem;
  ${toolbarButtonAccent};
  font-size: 0.875rem;
  font-weight: 700;
`

type AddButtonProps = {
  onClick: () => void
  label?: string
  disabled?: boolean
}

export function AddButton({ onClick, label = 'הוסף', disabled = false }: AddButtonProps) {
  return (
    <StyledAddButton type="button" onClick={onClick} disabled={disabled}>
      {label}
    </StyledAddButton>
  )
}
