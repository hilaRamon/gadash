import styled from 'styled-components'
import { DownloadIcon } from '../Icons'
import { buttonBase } from './sharedStyles'

/* =========================================================================
 * ExportButton
 * Exports the currently visible rows to Excel. The text label collapses on
 * narrow screens, leaving only the icon. Equivalent of `.btn.btn-export`.
 * ========================================================================= */

const StyledExportButton = styled.button`
  ${buttonBase};
  flex-shrink: 0;
  white-space: nowrap;
`

const ExportLabel = styled.span`
  display: inline;

  @media (max-width: 640px) {
    display: none;
  }
`

type ExportButtonProps = {
  disabled?: boolean
  onClick: () => void
}

export function ExportButton({ disabled = false, onClick }: ExportButtonProps) {
  return (
    <StyledExportButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="ייצוא לאקסל"
      title="ייצוא לאקסל"
    >
      <DownloadIcon />
      <ExportLabel>ייצוא לאקסל</ExportLabel>
    </StyledExportButton>
  )
}
