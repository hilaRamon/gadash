import { css } from 'styled-components'

export const fieldControlStyles = css`
  width: 100%;
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--page-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.875rem;
  box-sizing: border-box;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`

export const buttonBaseStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`
