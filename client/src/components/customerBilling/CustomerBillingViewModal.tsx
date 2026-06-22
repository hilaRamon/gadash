import { useEffect } from "react";
import styled from "styled-components";
import type { CollectionDocument } from "../../schema/types";
import { useSavedBillingBillPreview } from "../../hooks/customerBilling/useSavedBillingBillPreview";

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
    <Overlay onClick={onClose}>
      <Modal onClick={(event) => event.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>חשבונית — {customerName}</ModalTitle>
          <CloseButton type="button" onClick={onClose} aria-label="סגירה">
            ×
          </CloseButton>
        </ModalHeader>
        <ModalBody>
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
        </ModalBody>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1.5rem 1rem;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.55);
`;

const Modal = styled.div`
  width: 100%;
  max-width: min(920px, 100%);
  margin: auto;
  border-radius: 12px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem;
`;

const PaperFrame = styled.div`
  max-width: 210mm;
  margin: 0 auto;
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: #fff;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

const PaperContent = styled.div`
  color: #1a202c;
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
  color: #fc8181;
`;
