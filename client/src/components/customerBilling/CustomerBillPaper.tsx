/**
 * Printable invoice preview at the bottom of create-billing.
 * Fetches HTML via useCustomerBillPreview (server bill-preview endpoint in production).
 * Does not use the table preview data directly for layout — server rebuilds the bill document.
 */
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useQueryClient } from "@tanstack/react-query";
import {
  buildCustomerBillRequest,
  createCustomerBilling,
  downloadCustomerBillPdf,
  hasIncludedBillItems,
  type UnbilledPreview,
} from "../../lib/customerBillingApi";
import { useCustomerBillPreview } from "../../hooks/customerBilling/useCustomerBillPreview";
import { collectionKeys, customerBillingKeys } from "../../lib/queryKeys";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

type CustomerBillPaperProps = {
  customerId: string;
  customerName: string;
  preview: UnbilledPreview;
  includedIds: Set<string>;
};

export function CustomerBillPaper({
  customerId,
  customerName,
  preview,
  includedIds,
}: CustomerBillPaperProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const request = buildCustomerBillRequest(customerId, preview, includedIds);
  const hasItems = hasIncludedBillItems(request);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useCustomerBillPreview({
    customerId,
    customerName,
    preview,
    includedIds,
    enabled: hasItems,
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateBilling = useCallback(async () => {
    if (!hasItems) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      await createCustomerBilling(request, { customerName, preview });
      await queryClient.invalidateQueries({
        queryKey: customerBillingKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: collectionKeys.lists(),
      });
      navigate("/trackings/customer-billing");
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "שגיאה ביצירת החיוב",
      );
    } finally {
      setIsCreating(false);
    }
  }, [customerName, hasItems, navigate, preview, queryClient, request]);

  const handleDownload = useCallback(async () => {
    if (!hasItems || useMock) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadCustomerBillPdf(request, customerName);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "שגיאה בהורדת הקובץ",
      );
    } finally {
      setIsDownloading(false);
    }
  }, [customerName, hasItems, request]);

  if (!hasItems) {
    return null;
  }

  return (
    <BillBlock>
      <BillToolbar>
        <BillHeading>חשבונית ללקוח</BillHeading>
        <ToolbarActions>
          <CreateBillingButton
            type="button"
            onClick={handleCreateBilling}
            disabled={isCreating || isLoading}
          >
            {isCreating ? "יוצר חיוב..." : "צור חיוב"}
          </CreateBillingButton>
          <DownloadButton
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || useMock || isLoading}
            title={useMock ? "זמין רק עם שרת" : undefined}
          >
            {isDownloading ? "מוריד..." : "הורד PDF"}
          </DownloadButton>
        </ToolbarActions>
      </BillToolbar>
      {useMock && (
        <MockNote>הורדת PDF זמינה רק עם שרת</MockNote>
      )}
      {createError && <ErrorText role="alert">{createError}</ErrorText>}
      {downloadError && (
        <ErrorText role="alert">{downloadError}</ErrorText>
      )}
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
    </BillBlock>
  );
}

const BillBlock = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  max-width: 100%;
`;

const BillToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const ToolbarActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

const BillHeading = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const CreateBillingButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: var(--accent);
  color: #fff;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DownloadButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--hover-bg);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
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

  td.price,
  td.numeric,
  .bill-total-amount {
    direction: ltr;
    text-align: right;
    unicode-bidi: isolate;
  }
`;

const StatusText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const MockNote = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #fc8181;
`;
