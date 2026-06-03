import type { CollectionSchema } from "../types";
import { formatNumber } from "../../lib/formatNumber";

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("he-IL");
}

export const transportTrackingsSchema: CollectionSchema = {
  id: "transport-trackings",
  collection: "transportTrackings",
  label: "מעקב הובלות",
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
      key: "mover",
      label: "מוביל",
      type: "reference",
      searchable: true,
      getValue: (row) => row.moverName ?? row.mover,
    },
    {
      key: "startTime",
      label: "שעת התחלה",
      type: "text",
      width: "6rem",
    },
    {
      key: "endTime",
      label: "שעת סיום",
      type: "text",
      width: "6rem",
    },
    {
      key: "hourlyRate",
      label: "מחיר לשעה",
      type: "number",
      sortable: true,
      format: (value) => formatNumber(value),
      width: "7rem",
    },
    {
      key: "hours",
      label: "כמות שעות",
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
      key: "notes",
      label: "הערות",
      type: "text",
      searchable: true,
    },
  ],
  defaultSort: { field: "date", direction: "desc" },
  form: {
    createTitle: "הוספת מעקב הובלה",
    editTitle: "עריכת מעקב הובלה",
    fields: [
      { key: "date", label: "תאריך", type: "date", required: true },
      {
        key: "mover",
        label: "מוביל",
        type: "reference",
        required: true,
        referenceCollection: "movers",
      },
      { key: "startTime", label: "שעת התחלה", type: "time", required: true },
      { key: "endTime", label: "שעת סיום", type: "time", required: true },
      { key: "hourlyRate", label: "מחיר לשעה", type: "number", required: true },
      { key: "hours", label: "כמות שעות", type: "number" },
      { key: "finalPrice", label: "מחיר סופי", type: "number" },
      { key: "notes", label: "הערות", type: "textarea" },
    ],
  },
};
