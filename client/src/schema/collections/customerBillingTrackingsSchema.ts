import type { CollectionSchema } from "../types";
import { customerBillingStatusOptions } from "../../lib/customerBillingStatuses";
import { formatNumber } from "../../lib/formatNumber";

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("he-IL");
}

export const customerBillingTrackingsSchema: CollectionSchema = {
  id: "customer-billing-trackings",
  collection: "customerBillingTrackings",
  label: "מעקב חיובי לקוחות",
  rowAction: "view",
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
      key: "customer",
      label: "לקוח",
      type: "reference",
      searchable: true,
      getValue: (row) => row.customerName ?? row.customer,
    },

    {
      key: "finalPrice",
      label: "סכום סופי",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "8rem",
    },
    {
      key: "status",
      label: "סטטוס",
      type: "enum",
      enumOptions: customerBillingStatusOptions,
      filterable: true,
      width: "10rem",
    },
    {
      key: "paid",
      label: "שולם",
      type: "boolean",
      filterable: true,
      width: "5rem",
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
    createTitle: "הוספת מעקב חיוב",
    editTitle: "עריכת מעקב חיוב",
    fields: [
      { key: "date", label: "תאריך", type: "date", required: true },
      {
        key: "customer",
        label: "לקוח",
        type: "reference",
        required: true,
        referenceCollection: "customers",
      },
      {
        key: "status",
        label: "סטטוס",
        type: "enum",
        required: true,
        enumOptions: customerBillingStatusOptions,
        defaultValue: "לא אושר כלל",
      },
      {
        key: "finalPrice",
        label: "סכום סופי",
        type: "number",
        required: true,
      },
      {
        key: "paid",
        label: "שולם",
        type: "boolean",
        defaultValue: false,
      },
      { key: "notes", label: "הערות", type: "textarea" },
    ],
  },
};
