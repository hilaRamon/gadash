import { useEffect, useState } from "react";
import styled from "styled-components";
import { ModalOverlay } from "@/components/ui/ModalOverlay";
import { ModalPanel } from "@/components/ui/Modal";
import type { CollectionDocument } from "@/schema/types";
import { fetchInvoiceFileBlobUrl } from "@/lib/invoiceApi";

type InvoiceViewModalProps = {
  open: boolean;
  invoice: CollectionDocument | null;
  onClose: () => void;
};

export function InvoiceViewModal({ open, invoice, onClose }: InvoiceViewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const invoiceLabel = String(invoice?.invoiceNumber ?? "").trim() || "חשבונית";

  useEffect(() => {
    if (!open || !invoice) return;

    let revoked = false;
    setIsLoading(true);
    setErrorMessage(null);
    setBlobUrl(null);

    fetchInvoiceFileBlobUrl(invoice._id)
      .then((result) => {
        if (!revoked) {
          setBlobUrl(result.blobUrl);
          setContentType(result.contentType);
        }
      })
      .catch((err) => {
        if (!revoked)
          setErrorMessage(err instanceof Error ? err.message : "שגיאה בטעינת הקובץ");
      })
      .finally(() => {
        if (!revoked) setIsLoading(false);
      });

    return () => {
      revoked = true;
    };
  }, [open, invoice]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    if (!open) {
      setBlobUrl(null);
      setContentType("");
      setErrorMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !invoice) return null;

  const isImageFile = contentType.startsWith("image/");

  return (
    <ModalOverlay open={open} onClose={onClose} layout="scrollable">
      <ModalPanel
        title={`קובץ חשבונית — ${invoiceLabel}`}
        onClose={onClose}
        maxWidth="min(820px, 100%)"
      >
        {isLoading ? (
          <StatusText>טוען קובץ...</StatusText>
        ) : errorMessage ? (
          <ErrorText role="alert">{errorMessage}</ErrorText>
        ) : blobUrl ? (
          <PreviewFrame>
            {isImageFile ? (
              <PreviewImage src={blobUrl} alt={`קובץ חשבונית ${invoiceLabel}`} />
            ) : (
              <FileFrame src={blobUrl} title={`קובץ חשבונית ${invoiceLabel}`} />
            )}
          </PreviewFrame>
        ) : null}
      </ModalPanel>
    </ModalOverlay>
  );
}

const StatusText = styled.p`
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
`;

const ErrorText = styled.p`
  padding: 2rem;
  text-align: center;
  color: var(--color-error-text);
`;

const PreviewFrame = styled.div`
  max-width: 210mm;
  margin: 0 auto;
  width: 100%;
  min-height: 12rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--surface-raised, var(--surface));
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
`;

const PreviewImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
`;

const FileFrame = styled.iframe`
  display: block;
  width: 100%;
  height: 60vh;
  border: none;
  background: white;
`;
