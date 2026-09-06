import { useEffect } from "react";
import styled from "styled-components";
import { ModalOverlay } from "@/components/ui/ModalOverlay";
import { ModalPanel } from "@/components/ui/Modal";
import { useQuery } from "@tanstack/react-query";
import { formatNumber, formatWholeNumber } from "@/lib/formatNumber";
import {
  fetchTransportGlobalChargeDetail,
  type GlobalTransportChargeDetail,
} from "@/api/transportGlobalChargeApi";
import { transportGlobalChargeKeys } from "@/queries/queryKeys";

type GlobalTransportChargeViewModalProps = {
  open: boolean;
  chargeId: string | null;
  onClose: () => void;
};

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("he-IL");
}

export function GlobalTransportChargeViewModal({
  open,
  chargeId,
  onClose,
}: GlobalTransportChargeViewModalProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: transportGlobalChargeKeys.detail(chargeId ?? ""),
    queryFn: () => fetchTransportGlobalChargeDetail(chargeId!),
    enabled: open && chargeId != null,
  });

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !chargeId) return null;

  return (
    <ModalOverlay open={open} onClose={onClose} layout="scrollable">
      <ModalPanel
        title="פרטי חיוב גלובלי"
        onClose={onClose}
        maxWidth="min(720px, 100%)"
      >
        {isLoading ? (
          <StatusText>טוען פרטים...</StatusText>
        ) : isError ? (
          <ErrorText role="alert">
            {error instanceof Error ? error.message : "שגיאה בטעינת הפרטים"}
          </ErrorText>
        ) : data ? (
          <ChargeDetailContent detail={data} />
        ) : null}
      </ModalPanel>
    </ModalOverlay>
  );
}

function ChargeDetailContent({
  detail,
}: {
  detail: GlobalTransportChargeDetail;
}) {
  return (
    <>
      <SummaryGrid>
        <dt>עונה</dt>
        <dd>{detail.seasonYear}</dd>
        <dt>תאריך ביצוע</dt>
        <dd>{formatDate(detail.executedAt)}</dd>
        <dt>סה״כ הובלות</dt>
        <dd>{formatNumber(detail.transportTotal)}</dd>
        <dt>מחיר לדונם</dt>
        <dd>{formatNumber(detail.pricePerDunam)}</dd>
        <dt>סה״כ דונמים</dt>
        <dd>{formatNumber(detail.totalDunam)}</dd>
        <dt>מספר הובלות</dt>
        <dd>{detail.transportRowCount}</dd>
        <dt>לקוחות שחויבו</dt>
        <dd>{detail.billsCount}</dd>
      </SummaryGrid>

      <AllocationsSection>
        <AllocationsTitle>לקוחות</AllocationsTitle>
        {detail.allocations.length === 0 ? (
          <StatusText>אין לקוחות בחיוב זה</StatusText>
        ) : (
          <AllocationsTable>
            <thead>
              <tr>
                <th>לקוח</th>
                <th>דונם</th>
                <th>מחיר לדונם</th>
                <th>סכום</th>
                <th>חויב</th>
              </tr>
            </thead>
            <tbody>
              {detail.allocations.map((allocation) => (
                <tr key={allocation._id}>
                  <td>{allocation.customerName || "—"}</td>
                  <td>{formatNumber(allocation.dunam)}</td>
                  <td>{formatNumber(allocation.pricePerDunam)}</td>
                  <td>{formatWholeNumber(allocation.finalPrice)}</td>
                  <td>{allocation.wasCharged ? "כן" : "לא"}</td>
                </tr>
              ))}
            </tbody>
          </AllocationsTable>
        )}
      </AllocationsSection>
    </>
  );
}

const SummaryGrid = styled.dl`
  margin: 0 0 1.5rem;
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
`;

const AllocationsSection = styled.section`
  margin-top: 0.5rem;
`;

const AllocationsTitle = styled.h3`
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 700;
`;

const AllocationsTable = styled.table`
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
`;

const StatusText = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--danger, #c0392b);
  font-size: 0.875rem;
`;
