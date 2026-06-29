export {
  buttonBase,
  buttonError,
  buttonHoverLighten,
  buttonPrimary,
  toolbarButtonAccent,
  toolbarButtonExport,
  toolbarButtonMaterial,
} from '../../../styles/buttonStyles'

import { css } from 'styled-components'

export const selectControl = css`
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.875rem;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`
