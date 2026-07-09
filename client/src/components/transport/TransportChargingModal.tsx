import styled from 'styled-components'
import { ModalOverlay } from '@/components/ui/ModalOverlay'
import { ModalPanel } from '@/components/ui/Modal'
import { formatNumber } from "@/lib/formatNumber"
import { buttonBase, toolbarButtonAccent } from "@/styles/buttonStyles"

type TransportChargingModalProps = {
  open: boolean
  seasonYear: number
  totalSum: number
  rowCount: number
  isPending?: boolean
  errorMessage?: string
  onConfirm: () => void
  onClose: () => void
}

const SummaryList = styled.dl`
  margin: 0 0 1.25rem;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  font-size: 0.875rem;

  dt {
    margin: 0;
    color: var(--text-secondary);
  }

  dd {
    margin: 0;
    font-weight: 600;
    color: var(--text-primary);
  }
`

const ErrorText = styled.p`
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--danger, #c0392b);
`

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-start;
`

const SecondaryButton = styled.button`
  ${buttonBase};
  background: transparent;
`

const PrimaryButton = styled.button`
  ${buttonBase};
  ${toolbarButtonAccent};
  font-weight: 600;
`

export function TransportChargingModal({
  open,
  seasonYear,
  totalSum,
  rowCount,
  isPending = false,
  errorMessage,
  onConfirm,
  onClose,
}: TransportChargingModalProps) {
  if (!open) return null

  return (
    <ModalOverlay open={open} onClose={onClose} layout="centered">
      <ModalPanel
        title="ביצוע חיוב גלובלי"
        titleId="charge-modal-title"
        role="dialog"
        aria-modal={true}
        aria-labelledby="charge-modal-title"
      >
        <SummaryList>
          <dt>עונה</dt>
          <dd>{seasonYear}</dd>
          <dt>מספר רשומות לחיוב</dt>
          <dd>{rowCount}</dd>
          <dt>סה״כ לחיוב</dt>
          <dd>{formatNumber(totalSum)}</dd>
        </SummaryList>
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
        <Actions>
          <SecondaryButton type="button" onClick={onClose} disabled={isPending}>
            ביטול
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'מבצע…' : 'אישור'}
          </PrimaryButton>
        </Actions>
      </ModalPanel>
    </ModalOverlay>
  )
}
