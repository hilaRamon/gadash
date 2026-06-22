import styled, { keyframes } from 'styled-components'
import { visuallyHidden } from './sharedStyles'

const cellSavingSpin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

const SavingSpinner = styled.span`
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: ${cellSavingSpin} 0.65s linear infinite;
`

const SavingIndicatorOverlay = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`

const SavingIndicatorInline = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  pointer-events: none;
`

const ScreenReaderText = styled.span`
  ${visuallyHidden};
`

type CellSavingIndicatorProps = {
  variant?: 'overlay' | 'inline'
}

export function CellSavingIndicator({ variant = 'overlay' }: CellSavingIndicatorProps) {
  const Indicator = variant === 'inline' ? SavingIndicatorInline : SavingIndicatorOverlay

  return (
    <Indicator role="status">
      <SavingSpinner aria-hidden="true" />
      <ScreenReaderText>שומר...</ScreenReaderText>
    </Indicator>
  )
}
