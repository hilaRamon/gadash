import styled from 'styled-components'
import { formatNumber } from '../../lib/formatNumber'
import { buttonBase, toolbarButtonAccent } from '../../styles/buttonStyles'

type TransportChargingModalProps = {
  open: boolean
  periodStartDate: string
  totalSum: number
  rowCount: number
  isPending?: boolean
  onConfirm: () => void
  onClose: () => void
}

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

const Modal = styled.div`
  width: 100%;
  max-width: 24rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
`

const ModalTitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 700;
`

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

function formatDisplayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('he-IL')
}

export function TransportChargingModal({
  open,
  periodStartDate,
  totalSum,
  rowCount,
  isPending = false,
  onConfirm,
  onClose,
}: TransportChargingModalProps) {
  if (!open) return null

  return (
    <Overlay role="presentation" onClick={onClose}>
      <Modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="charge-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalTitle id="charge-modal-title">ביצוע חיוב</ModalTitle>
        <SummaryList>
          <dt>מתאריך</dt>
          <dd>{formatDisplayDate(periodStartDate)}</dd>
          <dt>מספר רשומות</dt>
          <dd>{rowCount}</dd>
          <dt>סה״כ לחיוב</dt>
          <dd>{formatNumber(totalSum)}</dd>
        </SummaryList>
        <Actions>
          <SecondaryButton type="button" onClick={onClose} disabled={isPending}>
            ביטול
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onConfirm} disabled={isPending}>
            אישור
          </PrimaryButton>
        </Actions>
      </Modal>
    </Overlay>
  )
}
