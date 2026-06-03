import type { CollectionSchema } from "../types";
import { formatNumber } from "../../lib/formatNumber";
import { CONTRACTOR_PRICING_FORMS } from "../../lib/contractorTrackingPricing";

const pricingFormOptions = CONTRACTOR_PRICING_FORMS.map((value) => ({
  value,
  label: value,
}));

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("he-IL");
}

export const contractorTrackingsSchema: CollectionSchema = {
  id: "contractor-trackings",
  collection: "contractorTrackings",
  label: "מעקב קבלנים",
  columns: [
    {
      key: "date",
      label: "תאריך",
      type: "date",
      sortable: true,
      format: (value) => formatDate(value),
      width: "8rem",
    },
    {
      key: "contractor",
      label: "קבלן",
      type: "reference",
      searchable: true,
      getValue: (row) => row.contractorName ?? row.contractor,
    },
    {
      key: "plot",
      label: "חלקה",
      type: "reference",
      searchable: true,
      getValue: (row) => row.plotName ?? row.plot,
    },
    {
      key: "operation",
      label: "פעולה",
      type: "reference",
      searchable: true,
      getValue: (row) => row.operationName ?? row.operation,
    },
    {
      key: "pricingForm",
      label: "צורת תמחור",
      type: "enum",
      enumOptions: pricingFormOptions,
      filterable: true,
      width: "7rem",
    },
    {
      key: "unitPrice",
      label: "מחיר ליחידה",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "7rem",
    },
    {
      key: "unitAmount",
      label: "כמות יחידות",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "7rem",
    },
    {
      key: "finalPrice",
      label: "מחיר סופי",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "8rem",
    },
    {
      key: "customerPrice",
      label: "מחיר ללקוח",
      type: "number",
      sortable: true,
      format: (value) =>
        value == null || value === "" ? "—" : formatNumber(value),
      width: "8rem",
    },
    {
      key: "notes",
      label: "הערות",
      type: "text",
      searchable: true,
    },
  ],
  defaultSort: { field: "date", direction: "desc" },
  form: {
    createTitle: "הוספת מעקב קבלן",
    editTitle: "עריכת מעקב קבלן",
    fields: [
      { key: "date", label: "תאריך", type: "date", required: true },
      {
        key: "contractor",
        label: "קבלן",
        type: "reference",
        required: true,
        referenceCollection: "contractors",
      },
      {
        key: "plot",
        label: "חלקה",
        type: "reference",
        required: true,
        referenceCollection: "plots",
      },
      {
        key: "operation",
        label: "פעולה",
        type: "reference",
        required: true,
        referenceCollection: "operations",
      },
      {
        key: "pricingForm",
        label: "צורת תמחור",
        type: "enum",
        required: true,
        enumOptions: pricingFormOptions,
      },
      { key: "startTime", label: "שעת התחלה", type: "time" },
      { key: "endTime", label: "שעת סיום", type: "time" },
      { key: "unitPrice", label: "מחיר ליחידה", type: "number", required: true },
      { key: "unitAmount", label: "כמות יחידות", type: "number" },
      {
        key: "customerPrice",
        label: "מחיר ללקוח",
        type: "number",
        defaultValue: null,
      },
      { key: "notes", label: "הערות", type: "textarea" },
    ],
  },
};
