import { css } from 'styled-components'

export const buttonHoverLighten = css`
  transition: box-shadow 0.15s ease;

  &:hover:not(:disabled) {
    box-shadow: inset 0 0 0 100vmax var(--button-hover-lighten);
  }
`

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

  ${buttonHoverLighten};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const filledButton = css`
  border: none;
`

/** Matches form submit / PrimaryButton — collection Add. */
export const toolbarButtonAccent = css`
  ${filledButton};
  background: var(--accent);
  color: var(--text-on-primary);
`

/** Warm secondary — pairs with accent green (employee material card). */
export const toolbarButtonMaterial = css`
  ${filledButton};
  background: var(--color-employee-material);
  color: var(--text-on-brand);
`

/** Green sibling of accent — export and other tertiary toolbar actions. */
export const toolbarButtonExport = css`
  ${filledButton};
  background: var(--color-primary);
  color: var(--text-on-brand);
`

/** Destructive filled buttons — bulk delete, confirm dialog. */
export const buttonError = css`
  ${filledButton};
  background: var(--color-error);
  color: var(--text-on-error);
`

/** Report page and similar primary green CTAs. */
export const buttonPrimary = css`
  ${filledButton};
  background: var(--color-primary);
  color: var(--text-on-brand);
`
