import { useEffect, useState, type FocusEvent } from "react";
import styled, { css } from "styled-components";
import type { CollectionDocument, ColumnDef } from "../../../schema/types";
import { getCellValue } from "../../../lib/tableQuery";
import { CellSavingIndicator } from "./CellSavingIndicator";

const CellEditableWrap = styled.span<{ $previewMode?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  vertical-align: middle;

  ${({ $previewMode }) =>
    $previewMode &&
    css`
      max-height: 1.25rem;
      overflow: hidden;
    `}
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

  &::-webkit-contacts-auto-fill-button,
  &::-webkit-credentials-auto-fill-button,
  &::-webkit-credit-card-auto-fill-button,
  &::-webkit-strong-password-auto-fill-button {
    visibility: hidden;
    display: none !important;
    pointer-events: none;
  }

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
  if (value == null || value === "") return "";
  return String(value);
}

function parseInputValue(raw: string, allowEmpty: boolean): number | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return allowEmpty ? null : undefined;
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return undefined;
  return num;
}

type EditableNumberCellProps = {
  column: ColumnDef;
  row: CollectionDocument;
  previewMode?: boolean;
  onChange: (value: unknown) => void | Promise<void>;
};

export function EditableNumberCell({
  column,
  row,
  previewMode = false,
  onChange,
}: EditableNumberCellProps) {
  const serverValue = getCellValue(row, column);
  const serverInputValue = toInputValue(serverValue);
  const [inputValue, setInputValue] = useState(serverInputValue);
  const [isSaving, setIsSaving] = useState(false);
  const allowEmpty = column.nullable === true;

  useEffect(() => {
    setInputValue(serverInputValue);
  }, [serverInputValue, row._id]);

  const handleBlur = async (event: FocusEvent<HTMLInputElement>) => {
    const nextInput = event.target.value;
    if (nextInput === serverInputValue) {
      setInputValue(serverInputValue);
      return;
    }

    const parsed = parseInputValue(nextInput, allowEmpty);
    if (parsed === undefined) {
      setInputValue(serverInputValue);
      return;
    }

    const nextComparable = parsed == null ? "" : String(parsed);
    const serverComparable =
      serverValue == null || serverValue === "" ? "" : String(serverValue);
    if (nextComparable === serverComparable) {
      setInputValue(serverInputValue);
      return;
    }

    setIsSaving(true);
    try {
      await onChange(parsed);
      setInputValue(toInputValue(parsed));
    } catch {
      setInputValue(serverInputValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CellEditableWrap aria-busy={isSaving} $previewMode={previewMode}>
      <CellInput
        type="text"
        inputMode="decimal"
        name={`cell-number-${row._id}-${column.key}`}
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
