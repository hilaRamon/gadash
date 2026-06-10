import { useEffect, useState, type FocusEvent } from "react";
import styled, { css } from "styled-components";
import type { CollectionDocument, ColumnDef } from "../../../schema/types";
import { getCellValue } from "../../../lib/tableQuery";
import { CellSavingIndicator } from "./CellSavingIndicator";

const CellEditableWrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  vertical-align: middle;
`;

const CellInput = styled.input<{ $saving?: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  width: 0;
  height: 1.25rem;
  margin: 0;
  padding: 0 0.35rem;
  box-sizing: border-box;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: inherit;
  line-height: 1.25rem;
  text-align: right;
  appearance: none;
  -webkit-appearance: none;

  &:hover {
    border-color: var(--border-color);
    background-color: var(--page-bg);
  }

  &:focus,
  &:focus-visible {
    border-color: var(--accent);
    outline: none;
    background-color: var(--page-bg);
  }

  ${({ $saving }) =>
    $saving &&
    css`
      opacity: 0.6;
      pointer-events: none;
    `}
`;

function toInputValue(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

type EditableTextCellProps = {
  column: ColumnDef;
  row: CollectionDocument;
  onChange: (value: unknown) => void | Promise<void>;
};

export function EditableTextCell({
  column,
  row,
  onChange,
}: EditableTextCellProps) {
  const serverValue = getCellValue(row, column);
  const serverInputValue = toInputValue(serverValue);
  const [inputValue, setInputValue] = useState(serverInputValue);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInputValue(serverInputValue);
  }, [serverInputValue, row._id]);

  const handleBlur = async (event: FocusEvent<HTMLInputElement>) => {
    const nextInput = event.target.value;
    if (nextInput === serverInputValue) {
      setInputValue(serverInputValue);
      return;
    }

    setIsSaving(true);
    try {
      await onChange(nextInput);
      setInputValue(nextInput);
    } catch {
      setInputValue(serverInputValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CellEditableWrap aria-busy={isSaving}>
      <CellInput
        type="text"
        name={`cell-text-${row._id}-${column.key}`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-1p-ignore="true"
        data-lpignore="true"
        data-bwignore="true"
        data-form-type="other"
        value={inputValue}
        disabled={isSaving}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        aria-label={`עריכת ${column.label}`}
      />
      {isSaving && <CellSavingIndicator variant="inline" />}
    </CellEditableWrap>
  );
}
