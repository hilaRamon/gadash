import styled from "styled-components";
import { DeleteIcon, DiscountIcon } from "@/components/collection/Icons";
import { ActionTooltip } from "@/components/collection/DataTable/ActionTooltip";
import { CellSavingIndicator } from "@/components/collection/DataTable/CellSavingIndicator";
import type { CollectionDocument } from "@/schema/types";

export function isDiscountRow(row: CollectionDocument): boolean {
  return row.isDiscount === true;
}

export function DiscountAction({
  row,
  onOpenDiscount,
}: {
  row: CollectionDocument;
  onOpenDiscount: (row: CollectionDocument) => void;
}) {
  const label = isDiscountRow(row) ? "ערוך הנחה" : "הוסף הנחה";
  return (
    <ActionTooltip text={label}>
      <DiscountButton
        type="button"
        aria-label={label}
        onClick={() => onOpenDiscount(row)}
      >
        <DiscountIcon size={14} />
      </DiscountButton>
    </ActionTooltip>
  );
}

export function CancelDiscountAction({
  canceling,
  onCancel,
}: {
  canceling: boolean;
  onCancel: () => void;
}) {
  return (
    <ActionTooltip text="בטל הנחה">
      <DiscountButton
        type="button"
        aria-label="בטל הנחה"
        aria-busy={canceling}
        disabled={canceling}
        onClick={onCancel}
      >
        {canceling ? (
          <CellSavingIndicator variant="inline" />
        ) : (
          <DeleteIcon size={14} />
        )}
      </DiscountButton>
    </ActionTooltip>
  );
}

export const PriceWithAction = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  width: 100%;
  min-width: 0;
`;

export const EditorSlot = styled.span`
  flex: 1 1 auto;
  min-width: 0;
`;

const DiscountButton = styled.button`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--text-primary);
  }

  &:disabled {
    cursor: default;
  }
`;
