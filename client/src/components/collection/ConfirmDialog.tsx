import type { ReactNode } from 'react'
import styled from 'styled-components'
import { ModalOverlay } from '@/components/ui/ModalOverlay'
import { ModalPanel } from '@/components/ui/Modal'
import { buttonBase, buttonError } from "@/styles/buttonStyles"

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  isPending?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

const Message = styled.div`
  margin: 0 0 1.25rem;
  color: var(--text-secondary);
`

const ErrorText = styled.p`
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--color-error-text);
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
  ${buttonError};
`

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  isPending = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <ModalOverlay open={open} onClose={onCancel} layout="centered">
      <ModalPanel
        title={title}
        titleId="dialog-title"
        role="alertdialog"
        aria-modal={true}
        aria-labelledby="dialog-title"
      >
        <Message>{message}</Message>
        {error && <ErrorText role="alert">{error}</ErrorText>}
        <Actions>
          <CancelButton type="button" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </CancelButton>
          <ConfirmButton type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'מוחק...' : confirmLabel}
          </ConfirmButton>
        </Actions>
      </ModalPanel>
    </ModalOverlay>
  )
}
