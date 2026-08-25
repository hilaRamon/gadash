import { useRef, useState } from "react";
import styled from "styled-components";
import { buttonBase } from "@/styles/buttonStyles";

type InvoiceFileUploadFieldProps = {
  hasExistingFile?: boolean;
  existingFileName?: string | null;
  onFileChange?: (file: File | null) => void;
};

export function InvoiceFileUploadField({
  hasExistingFile = false,
  existingFileName = null,
  onFileChange,
}: InvoiceFileUploadFieldProps) {
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <FileUploadField>
      <Label htmlFor="invoice-file-input">קובץ חשבונית</Label>
      <HiddenFileInput
        ref={fileInputRef}
        id="invoice-file-input"
        type="file"
        accept=".pdf,image/*"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          setSelectedFileName(file?.name ?? "");
          onFileChange?.(file);
        }}
      />
      <FilePickerRow>
        <FilePickerButton
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          בחירת קובץ
        </FilePickerButton>
        {selectedFileName ? (
          <SelectedFileName>{selectedFileName}</SelectedFileName>
        ) : null}
      </FilePickerRow>
      {hasExistingFile && (
        <ExistingFileNote>
          קובץ קיים: {String(existingFileName ?? "קובץ")}
        </ExistingFileNote>
      )}
      <FileTypeHint>קבצים נתמכים: PDF, PNG, JPEG, WebP</FileTypeHint>
    </FileUploadField>
  );
}

const FileUploadField = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FilePickerRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
`;

const FilePickerButton = styled.button`
  ${buttonBase};
  background: transparent;
`;

const SelectedFileName = styled.span`
  font-size: 0.875rem;
  color: var(--text-primary);
  word-break: break-word;
`;

const ExistingFileNote = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const FileTypeHint = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
`;
