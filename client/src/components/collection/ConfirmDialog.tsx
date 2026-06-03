import type { ReactNode } from 'react'
import styled, { css } from 'styled-components'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const buttonBase = css`
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

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.55);
`

const Panel = styled.div`
  width: 100%;
  max-width: 28rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
`

const Title = styled.h2`
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
`

const Message = styled.div`
  margin: 0 0 1.25rem;
  color: var(--text-secondary);
`

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-start;
`

const CancelButton = styled.button`
  ${buttonBase};
  background: transparent;
`

const ConfirmButton = styled.button`
  ${buttonBase};
  background: #c53030;
  border-color: transparent;
  color: #fff;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }
`

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <Overlay role="presentation" onClick={onCancel}>
      <Panel
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <Title id="dialog-title">{title}</Title>
        <Message>{message}</Message>
        <Actions>
          <CancelButton type="button" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </CancelButton>
          <ConfirmButton type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'מוחק...' : confirmLabel}
          </ConfirmButton>
        </Actions>
      </Panel>
    </Overlay>
  )
}
