import { EditableNumberCell } from "@/components/collection/DataTable/EditableNumberCell";
import { BALE_ORDER_BY_UNIT, isByWeightPricing } from "@/lib/baleOrderPricing";
import { formatNumber } from "@/lib/formatNumber";
import type {
  CollectionDocument,
  CollectionSchema,
  ColumnDef,
} from "@/schema/types";
import { balePreviewSchema } from "./billingPreviewSchemas";
import {
  CancelDiscountAction,
  DiscountAction,
  EditorSlot,
  isDiscountRow,
  PriceWithAction,
} from "./DiscountPriceActions";

type ActivePriceKey = "pricePerTon" | "pricePerUnit";

const billingColumnWidth: Record<string, string> = {
  date: "9%",
  bale: "14%",
  quantity: "7%",
  pricingForm: "10%",
  pricePerTon: "10%",
  pricePerUnit: "11%",
  priceAfterDiscount: "12%",
  weight: "7%",
  transportPrice: "10%",
  finalPrice: "10%",
};

function withBillingWidth(column: ColumnDef): ColumnDef {
  const width = billingColumnWidth[column.key];
  return width ? { ...column, width } : column;
}

const pricePerTonColumn: ColumnDef = {
  key: "pricePerTon",
  label: "מחיר לטון",
  type: "number",
  format: (value) => formatNumber(value),
};

const pricePerUnitColumn: ColumnDef = {
  key: "pricePerUnit",
  label: "מחיר ליחידה",
  type: "number",
  format: (value) => formatNumber(value),
};

function activePriceKey(row: CollectionDocument): ActivePriceKey {
  return isByWeightPricing(row.pricingForm) ? "pricePerTon" : "pricePerUnit";
}

function isActivePrice(row: CollectionDocument, key: ActivePriceKey): boolean {
  if (key === "pricePerTon") return isByWeightPricing(row.pricingForm);
  return String(row.pricingForm ?? "") === BALE_ORDER_BY_UNIT;
}

function savedActivePrice(row: CollectionDocument): unknown {
  return row[activePriceKey(row)];
}

type DiscountHandlers = {
  onOpenDiscount: (row: CollectionDocument) => void;
  onPriceChange: (
    row: CollectionDocument,
    key: ActivePriceKey,
    value: unknown,
  ) => void | Promise<void>;
};

function BalePriceCell({
  row,
  priceKey,
  onOpenDiscount,
  onPriceChange,
}: DiscountHandlers & { row: CollectionDocument; priceKey: ActivePriceKey }) {
  if (!isActivePrice(row, priceKey)) return null;
  return (
    <PriceWithAction>
      {isDiscountRow(row) ? (
        <span>{formatNumber(row.priceBeforeDiscount)}</span>
      ) : (
        <EditorSlot>
          <EditableNumberCell
            column={
              priceKey === "pricePerTon"
                ? pricePerTonColumn
                : pricePerUnitColumn
            }
            row={row}
            previewMode
            onChange={(value) => onPriceChange(row, priceKey, value)}
          />
        </EditorSlot>
      )}
      <DiscountAction row={row} onOpenDiscount={onOpenDiscount} />
    </PriceWithAction>
  );
}

export function buildBalesBillingSchema(
  options: DiscountHandlers & {
    showDiscountColumns: boolean;
    onCancelDiscount: (row: CollectionDocument) => void;
    cancelingDiscountId: string | null;
  },
): CollectionSchema {
  const priceAfterDiscountColumn: ColumnDef = {
    key: "priceAfterDiscount",
    label: "מחיר אחרי הנחה",
    type: "number",
    sortable: true,
    width: billingColumnWidth.priceAfterDiscount,
    format: (value) =>
      value == null || value === "" ? "" : formatNumber(value),
    getValue: (row) => (isDiscountRow(row) ? savedActivePrice(row) : null),
    render: (_value, row) => {
      if (!isDiscountRow(row)) return null;
      const canceling = options.cancelingDiscountId === row._id;
      return (
        <PriceWithAction>
          <span>{formatNumber(savedActivePrice(row))}</span>
          <CancelDiscountAction
            canceling={canceling}
            onCancel={() => options.onCancelDiscount(row)}
          />
        </PriceWithAction>
      );
    },
  };

  return {
    ...balePreviewSchema,
    columns: balePreviewSchema.columns.flatMap((column) => {
      if (column.key !== "pricePerTon" && column.key !== "pricePerUnit") {
        return [withBillingWidth(column)];
      }
      const priceKey = column.key as ActivePriceKey;
      const priceColumn: ColumnDef = {
        ...withBillingWidth(column),
        getValue: (row) => {
          if (!isActivePrice(row, priceKey)) return null;
          return isDiscountRow(row) ? row.priceBeforeDiscount : row[priceKey];
        },
        render: (_value, row) => (
          <BalePriceCell
            row={row}
            priceKey={priceKey}
            onOpenDiscount={options.onOpenDiscount}
            onPriceChange={options.onPriceChange}
          />
        ),
      };
      if (priceKey === "pricePerUnit" && options.showDiscountColumns) {
        return [priceColumn, priceAfterDiscountColumn];
      }
      return [priceColumn];
    }),
  };
}
