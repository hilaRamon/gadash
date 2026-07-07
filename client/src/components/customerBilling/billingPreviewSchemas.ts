import type { CollectionDocument, CollectionSchema, ColumnDef } from "@/schema/types";
import { operationsTrackingsAllSchema } from "@/schema/collections/operationsTrackingsSchema";
import { materialUsageTrackingsSchema } from "@/schema/collections/materialUsageTrackingsSchema";
import { baleOrderTrackingsSchema } from "@/schema/collections/baleOrderTrackingsSchema";
import { contractorTrackingsSchema } from "@/schema/collections/contractorTrackingsSchema";
import { isTransportBillingRow } from "@/lib/transportTrackingBilling";
import {
  BALE_ORDER_BY_UNIT,
  isByWeightPricing,
} from "@/lib/baleOrderPricing";
import { operationPricingFormOptions } from "@/lib/operationTrackingPricing";
import { formatNumber } from "@/lib/formatNumber";

type EditableRule = boolean | ((row: CollectionDocument) => boolean);

function toInlineEditable(
  rule: EditableRule,
): (row: CollectionDocument) => boolean {
  return typeof rule === "function" ? rule : () => rule;
}

function resolveBillingPreviewColumns(
  baseSchema: CollectionSchema,
  columns: Array<string | ColumnDef>,
): ColumnDef[] {
  return columns.map((item) => {
    if (typeof item === "string") {
      const col = baseSchema.columns.find((c) => c.key === item);
      if (!col) {
        throw new Error(`Column not found: ${item}`);
      }
      return { ...col, searchable: false };
    }
    return { ...item, searchable: false };
  });
}

function buildBillingPreviewSchema(
  baseSchema: CollectionSchema,
  columns: Array<string | ColumnDef>,
  editable: Record<string, EditableRule> = {},
  options?: { nullableKeys?: string[] },
): CollectionSchema {
  const nullable = new Set(options?.nullableKeys ?? []);

  return {
    ...baseSchema,
    columns: resolveBillingPreviewColumns(baseSchema, columns).map((col) => {
      const rule = editable[col.key];
      return {
        ...col,
        searchable: false,
        inlineEditable:
          rule !== undefined ? toInlineEditable(rule) : () => false,
        ...(nullable.has(col.key) ? { nullable: true } : {}),
      };
    }),
  };
}

export const operationsPreviewSchema: CollectionSchema = buildBillingPreviewSchema(
  operationsTrackingsAllSchema,
  [
    "date",
    "operation",
    "plot",
    {
      key: "pricingForm",
      label: "צורת תמחור",
      type: "enum",
      enumOptions: operationPricingFormOptions,
      width: "8rem",
    },
    {
      key: "unitCost",
      label: "מחיר ליחידה",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "8rem",
    },
    {
      key: "amount",
      label: "כמות",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "6rem",
    },
    "finalPrice",
  ],
  { unitCost: true, amount: true },
);

export const materialPreviewSchema: CollectionSchema = buildBillingPreviewSchema(
  materialUsageTrackingsSchema,
  ["date", "material", "plot", "amount", "unitPrice", "finalPrice"],
  { unitPrice: true, amount: true },
);

export const balePreviewSchema: CollectionSchema = buildBillingPreviewSchema(
  baleOrderTrackingsSchema,
  [
    "date",
    "bale",
    "quantity",
    "pricingForm",
    "pricePerTon",
    "pricePerUnit",
    "weight",
    "transportPrice",
    "finalPrice",
  ],
  {
    pricePerTon: (row) => isByWeightPricing(row.pricingForm),
    weight: (row) => isByWeightPricing(row.pricingForm),
    pricePerUnit: (row) => String(row.pricingForm ?? "") === BALE_ORDER_BY_UNIT,
    quantity: true,
    transportPrice: true,
  },
  { nullableKeys: ["weight", "transportPrice"] },
);

const contractorUnitCustomerPriceColumn: ColumnDef = {
  key: "unitCustomerPrice",
  label: "מחיר ללקוח ליחידה",
  type: "number",
  sortable: true,
  format: (value) =>
    value == null || value === "" ? "—" : formatNumber(value),
  width: "8rem",
  searchable: false,
};

export const contractorPreviewSchema: CollectionSchema = buildBillingPreviewSchema(
  contractorTrackingsSchema,
  [
    "date",
    "contractor",
    "plot",
    "operation",
    "pricingForm",
    "unitPrice",
    contractorUnitCustomerPriceColumn,
    "unitAmount",
    "customerFinalPrice",
  ],
  { unitCustomerPrice: (row) => !isTransportBillingRow(row) },
  { nullableKeys: ["unitCustomerPrice"] },
);

export function withoutPlotColumn(schema: CollectionSchema): CollectionSchema {
  return {
    ...schema,
    columns: schema.columns.filter((col) => col.key !== "plot"),
  };
}
