import { EditableNumberCell } from "@/components/collection/DataTable/EditableNumberCell";
import { formatNumber } from "@/lib/formatNumber";
import type { CollectionDocument, CollectionSchema, ColumnDef } from "@/schema/types";
import {
  operationsPreviewSchema,
  withoutPlotColumn,
} from "./billingPreviewSchemas";
import {
  CancelDiscountAction,
  DiscountAction,
  EditorSlot,
  isDiscountRow,
  PriceWithAction,
} from "./DiscountPriceActions";

const savedUnitCostColumn: ColumnDef = {
  key: "unitCost",
  label: "מחיר ליחידה",
  type: "number",
  format: (value) => formatNumber(value),
};

function isAdminRow(row: CollectionDocument): boolean {
  return String(row.operationType ?? "") === "מנהלה";
}

type DiscountHandlers = {
  onOpenDiscount: (row: CollectionDocument) => void;
  onUnitCostChange: (
    row: CollectionDocument,
    value: unknown,
  ) => void | Promise<void>;
};

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
          <CancelDiscountAction
            canceling={canceling}
            onCancel={() => options.onCancelDiscount(row)}
          />
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
