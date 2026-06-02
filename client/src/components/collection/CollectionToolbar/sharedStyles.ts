import { css } from 'styled-components'

/* =========================================================================
 * Shared style fragments
 * Mirror the global `.btn` / `.select-control` rules from Collection.css so
 * the toolbar is fully self-contained with styled-components.
 * ========================================================================= */

/* Base button — equivalent of `.btn` (+ hover/disabled states) */
export const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: var(--hover-bg);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

/* Select control — equivalent of `.select-control` (+ focus state) */
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
