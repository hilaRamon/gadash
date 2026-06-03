import styled, { keyframes } from 'styled-components'
import { visuallyHidden } from './sharedStyles'

const cellSavingSpin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

const SavingIndicator = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`

const SavingSpinner = styled.span`
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: ${cellSavingSpin} 0.65s linear infinite;
`

const ScreenReaderText = styled.span`
  ${visuallyHidden};
`

export function CellSavingIndicator() {
  return (
    <SavingIndicator role="status">
      <SavingSpinner aria-hidden="true" />
      <ScreenReaderText>שומר...</ScreenReaderText>
    </SavingIndicator>
  )
}
