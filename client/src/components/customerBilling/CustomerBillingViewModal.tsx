import { useEffect } from "react";
import styled from "styled-components";
import { ModalOverlay } from "@/components/ui/ModalOverlay";
import { ModalPanel } from "@/components/ui/Modal";
import type { CollectionDocument } from "@/schema/types";
import { useSavedBillingBillPreview } from "@/hooks/customerBilling/useSavedBillingBillPreview";

type CustomerBillingViewModalProps = {
  open: boolean;
  billing: CollectionDocument | null;
  onClose: () => void;
};

export function CustomerBillingViewModal({
  open,
  billing,
  onClose,
}: CustomerBillingViewModalProps) {
  const customerName = String(billing?.customerName ?? "").trim() || "לקוח";
  const { data, isLoading, isError, error } = useSavedBillingBillPreview({
    billing,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !billing) return null;

  return (
    <ModalOverlay open={open} onClose={onClose} layout="scrollable">
      <ModalPanel
        title={`חשבונית — ${customerName}`}
        onClose={onClose}
        maxWidth="min(920px, 100%)"
      >
        {isLoading ? (
          <StatusText>טוען חשבונית...</StatusText>
        ) : isError ? (
          <ErrorText role="alert">
            {error instanceof Error ? error.message : "שגיאה בטעינת החשבונית"}
          </ErrorText>
        ) : (
          <PaperFrame>
            <PaperContent
              dangerouslySetInnerHTML={{ __html: data?.html ?? "" }}
            />
          </PaperFrame>
        )}
      </ModalPanel>
    </ModalOverlay>
  );
}

const PaperFrame = styled.div`
  max-width: 210mm;
  margin: 0 auto;
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--print-bg);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

const PaperContent = styled.div`
  color: var(--print-text);
  direction: rtl;

  .bill {
    max-width: none;
  }

  table th,
  table td {
    text-align: right;
  }
`;

const StatusText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-error-text);
`;
