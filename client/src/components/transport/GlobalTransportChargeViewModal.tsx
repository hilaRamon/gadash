import { useEffect, useState } from "react";
import styled from "styled-components";
import { ModalOverlay } from "@/components/ui/ModalOverlay";
import { ModalPanel } from "@/components/ui/Modal";
import { useQuery } from "@tanstack/react-query";
import { formatNumber, formatWholeNumber } from "@/lib/formatNumber";
import {
  fetchTransportGlobalChargeDetail,
  type GlobalTransportChargeDetail,
} from "@/lib/transportGlobalChargeApi";
import { transportGlobalChargeKeys } from "@/lib/queryKeys";
import type { CollectionDocument } from "@/schema/types";
import { CustomerBillingViewModal } from "@/components/customerBilling/CustomerBillingViewModal";
import { buttonBase, buttonHoverLighten } from "@/styles/buttonStyles";

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
  const [viewingBilling, setViewingBilling] =
    useState<CollectionDocument | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: transportGlobalChargeKeys.detail(chargeId ?? ""),
    queryFn: () => fetchTransportGlobalChargeDetail(chargeId!),
    enabled: open && chargeId != null,
  });

  useEffect(() => {
    if (!open) {
      setViewingBilling(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && viewingBilling == null) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, viewingBilling]);

  if (!open || !chargeId) return null;

  return (
    <>
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
            <ChargeDetailContent detail={data} onViewBill={setViewingBilling} />
          ) : null}
        </ModalPanel>
      </ModalOverlay>

      <CustomerBillingViewModal
        open={viewingBilling !== null}
        billing={viewingBilling}
        onClose={() => setViewingBilling(null)}
      />
    </>
  );
}

function ChargeDetailContent({
  detail,
  onViewBill,
}: {
  detail: GlobalTransportChargeDetail;
  onViewBill: (billing: CollectionDocument) => void;
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
        <dt>מספר חשבונות</dt>
        <dd>{detail.billsCount}</dd>
      </SummaryGrid>

      <BillsSection>
        <BillsTitle>חשבונות לקוחות</BillsTitle>
        {detail.customerBillings.length === 0 ? (
          <StatusText>אין חשבונות מקושרים</StatusText>
        ) : (
          <BillsTable>
            <thead>
              <tr>
                <th>לקוח</th>
                <th>סכום</th>
                <th>סטטוס</th>
                <th>שולם</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {detail.customerBillings.map((billing) => (
                <tr key={billing._id}>
                  <td>{billing.customerName ?? "—"}</td>
                  <td>{formatWholeNumber(billing.finalPrice ?? 0)}</td>
                  <td>{billing.status ?? "—"}</td>
                  <td>{billing.paid === true ? "כן" : "לא"}</td>
                  <td>
                    <ViewBillButton
                      type="button"
                      onClick={() =>
                        onViewBill(billing as CollectionDocument)
                      }
                    >
                      צפה בחשבונית
                    </ViewBillButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </BillsTable>
        )}
      </BillsSection>
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

const BillsSection = styled.section`
  margin-top: 0.5rem;
`;

const BillsTitle = styled.h3`
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 700;
`;

const BillsTable = styled.table`
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

const ViewBillButton = styled.button`
  ${buttonBase};
  font-size: 0.8125rem;
  padding: 0.25rem 0.5rem;
  background: transparent;
  color: var(--accent);

  ${buttonHoverLighten};
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
