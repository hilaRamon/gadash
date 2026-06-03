import { css } from 'styled-components'
import { buttonBase } from '../CollectionToolbar/sharedStyles'

export const focusRing = css`
  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`

export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

export const buttonIconStyles = css`
  ${buttonBase};
  padding: 0.4rem;
  min-width: 2rem;
  min-height: 2rem;
`
