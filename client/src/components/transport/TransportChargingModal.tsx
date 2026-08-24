import styled from 'styled-components'
import { ModalOverlay } from '@/components/ui/ModalOverlay'
import { ModalPanel } from '@/components/ui/Modal'
import { formatNumber } from "@/lib/formatNumber"
import { buttonBase, toolbarButtonAccent } from "@/styles/buttonStyles"
import type { GlobalTransportChargePreview } from "@/lib/transportGlobalChargeApi"

type TransportChargingModalProps = {
  open: boolean
  seasonYear: number
  totalSum: number
  rowCount: number
  preview?: GlobalTransportChargePreview
  isPreviewLoading?: boolean
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

const CustomersSection = styled.section`
  margin: 0 0 1.25rem;
`

const CustomersTitle = styled.h3`
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 700;
`

const CustomersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;

  th,
  td {
    padding: 0.5rem 0.75rem;
    text-align: start;
    border-bottom: 1px solid var(--border-color);
  }

  th {
    color: var(--text-secondary);
    font-weight: 600;
  }
`

const StatusText = styled.p`
  margin: 0 0 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
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
  preview,
  isPreviewLoading = false,
  isPending = false,
  errorMessage,
  onConfirm,
  onClose,
}: TransportChargingModalProps) {
  if (!open) return null

  const confirmDisabled = isPending || isPreviewLoading || preview == null

  return (
    <ModalOverlay open={open} onClose={onClose} layout="scrollable">
      <ModalPanel
        title="ביצוע חיוב גלובלי"
        titleId="charge-modal-title"
        role="dialog"
        aria-modal={true}
        aria-labelledby="charge-modal-title"
        maxWidth="min(720px, 100%)"
        scrollable
      >
        <SummaryList>
          <dt>עונה</dt>
          <dd>{seasonYear}</dd>
          <dt>מספר רשומות לחיוב</dt>
          <dd>{preview?.transportRowCount ?? rowCount}</dd>
          <dt>סה״כ לחיוב</dt>
          <dd>{formatNumber(preview?.transportTotal ?? totalSum)}</dd>
          {preview ? (
            <>
              <dt>סה״כ דונמים</dt>
              <dd>{formatNumber(preview.totalDunam)}</dd>
              <dt>מחיר לדונם</dt>
              <dd>{formatNumber(preview.pricePerDunam)}</dd>
            </>
          ) : null}
        </SummaryList>
        {isPreviewLoading ? (
          <StatusText>טוען פרטי חיוב...</StatusText>
        ) : preview ? (
          <CustomersSection>
            <CustomersTitle>לקוחות לחיוב</CustomersTitle>
            {(preview.customers ?? []).length === 0 ? (
              <StatusText>אין לקוחות לחיוב</StatusText>
            ) : (
              <CustomersTable>
                <thead>
                  <tr>
                    <th>לקוח</th>
                    <th>דונם</th>
                    <th>סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {(preview.customers ?? []).map((customer, index) => (
                    <tr key={`${customer.customerName}-${index}`}>
                      <td>{customer.customerName}</td>
                      <td>{formatNumber(customer.dunam)}</td>
                      <td>{formatNumber(customer.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </CustomersTable>
            )}
          </CustomersSection>
        ) : null}
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
        <Actions>
          <SecondaryButton type="button" onClick={onClose} disabled={isPending}>
            ביטול
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onConfirm} disabled={confirmDisabled}>
            {isPending ? 'מבצע…' : 'אישור'}
          </PrimaryButton>
        </Actions>
      </ModalPanel>
    </ModalOverlay>
  )
}
