import styled from "styled-components";
import { DeleteIcon, DiscountIcon } from "@/components/collection/Icons";
import { ActionTooltip } from "@/components/collection/DataTable/ActionTooltip";
import { CellSavingIndicator } from "@/components/collection/DataTable/CellSavingIndicator";
import { EditableNumberCell } from "@/components/collection/DataTable/EditableNumberCell";
import { formatNumber } from "@/lib/formatNumber";
import type { CollectionDocument, CollectionSchema, ColumnDef } from "@/schema/types";
import {
  operationsPreviewSchema,
  withoutPlotColumn,
} from "./billingPreviewSchemas";

const savedUnitCostColumn: ColumnDef = {
  key: "unitCost",
  label: "מחיר ליחידה",
  type: "number",
  format: (value) => formatNumber(value),
};

function isAdminRow(row: CollectionDocument): boolean {
  return String(row.operationType ?? "") === "מנהלה";
}

function isDiscountRow(row: CollectionDocument): boolean {
  return row.isDiscount === true;
}

type DiscountHandlers = {
  onOpenDiscount: (row: CollectionDocument) => void;
  onUnitCostChange: (
    row: CollectionDocument,
    value: unknown,
  ) => void | Promise<void>;
};

function DiscountAction({
  row,
  onOpenDiscount,
}: {
  row: CollectionDocument;
  onOpenDiscount: (row: CollectionDocument) => void;
}) {
  if (isAdminRow(row)) return null;
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

function UnitPriceCell({
  row,
  onOpenDiscount,
  onUnitCostChange,
}: DiscountHandlers & { row: CollectionDocument }) {
  if (isAdminRow(row)) {
    return <>{formatNumber(row.unitCost)}</>;
  }
  return (
    <PriceWithAction>
      {isDiscountRow(row) ? (
        <span>{formatNumber(row.priceBeforeDiscount)}</span>
      ) : (
        <EditorSlot>
          <EditableNumberCell
            column={savedUnitCostColumn}
            row={row}
            previewMode
            onChange={(value) => onUnitCostChange(row, value)}
          />
        </EditorSlot>
      )}
      <DiscountAction row={row} onOpenDiscount={onOpenDiscount} />
    </PriceWithAction>
  );
}

export function buildOperationsBillingSchema(
  options: DiscountHandlers & {
    showPlots: boolean;
    showDiscountColumns: boolean;
    onCancelDiscount: (row: CollectionDocument) => void;
    cancelingDiscountId: string | null;
  },
): CollectionSchema {
  const base = options.showPlots
    ? operationsPreviewSchema
    : withoutPlotColumn(operationsPreviewSchema);
  const unitPriceColumn: ColumnDef = {
    key: "unitCost",
    label: "מחיר ליחידה",
    type: "number",
    sortable: true,
    width: "10.5rem",
    format: (value) => formatNumber(value),
    getValue: (row) =>
      isDiscountRow(row) ? row.priceBeforeDiscount : row.unitCost,
    render: (_value, row) => (
      <UnitPriceCell
        row={row}
        onOpenDiscount={options.onOpenDiscount}
        onUnitCostChange={options.onUnitCostChange}
      />
    ),
  };
  const priceAfterDiscountColumn: ColumnDef = {
    key: "priceAfterDiscount",
    label: "מחיר אחרי הנחה",
    type: "number",
    sortable: true,
    width: "10.5rem",
    format: (value) =>
      value == null || value === "" ? "" : formatNumber(value),
    getValue: (row) => (isDiscountRow(row) ? row.unitCost : null),
    render: (_value, row) => {
      if (!isDiscountRow(row) || isAdminRow(row)) return null;
      const canceling = options.cancelingDiscountId === row._id;
      return (
        <PriceWithAction>
          <span>{formatNumber(row.unitCost)}</span>
          <ActionTooltip text="בטל הנחה">
            <DiscountButton
              type="button"
              aria-label="בטל הנחה"
              aria-busy={canceling}
              disabled={canceling}
              onClick={() => options.onCancelDiscount(row)}
            >
              {canceling ? (
                <CellSavingIndicator variant="inline" />
              ) : (
                <DeleteIcon size={14} />
              )}
            </DiscountButton>
          </ActionTooltip>
        </PriceWithAction>
      );
    },
  };

  return {
    ...base,
    columns: base.columns.flatMap((column) => {
      if (column.key !== "unitCost") return [column];
      if (!options.showDiscountColumns) {
        return [
          {
            ...column,
            width: "10.5rem",
            render: (_value, row) => (
              <UnitPriceCell
                row={row}
                onOpenDiscount={options.onOpenDiscount}
                onUnitCostChange={options.onUnitCostChange}
              />
            ),
          },
        ];
      }
      return [unitPriceColumn, priceAfterDiscountColumn];
    }),
  };
}

const PriceWithAction = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  width: 100%;
  min-width: 0;
`;

const EditorSlot = styled.span`
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
