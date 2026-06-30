import type { CollectionSchema } from "../types";
import { formatNumber } from "../../lib/formatNumber";

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("he-IL");
}

export const transportGlobalChargesSchema: CollectionSchema = {
  id: "transport-global-charges",
  collection: "transportGlobalCharges",
  label: "מעקב חיובים גלובליים",
  rowAction: "view",
  columns: [
    {
      key: "executedAt",
      label: "תאריך ביצוע",
      type: "date",
      sortable: true,
      format: (value) => formatDate(value),
      width: "9rem",
    },
    {
      key: "seasonYear",
      label: "עונה",
      type: "number",
      sortable: true,
      width: "5rem",
    },
    {
      key: "transportTotal",
      label: "סה״כ הובלות",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "8rem",
    },
    {
      key: "pricePerDunam",
      label: "מחיר לדונם",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "8rem",
    },
    {
      key: "totalDunam",
      label: "סה״כ דונמים",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "8rem",
    },
    {
      key: "transportRowCount",
      label: "מספר הובלות",
      type: "number",
      sortable: true,
      width: "7rem",
    },
    {
      key: "billsCount",
      label: "מספר חשבונות",
      type: "number",
      sortable: true,
      width: "7rem",
    },
  ],
  defaultSort: { field: "executedAt", direction: "desc" },
  form: {
    createTitle: "חיוב גלובלי",
    editTitle: "חיוב גלובלי",
    fields: [],
  },
};
