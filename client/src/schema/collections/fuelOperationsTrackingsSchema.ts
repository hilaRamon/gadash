import type { CollectionSchema } from "../types";

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("he-IL");
}

export const fuelOperationsTrackingsSchema: CollectionSchema = {
  id: "fuel-operations-trackings",
  collection: "fuelOperationsTrackings",
  label: "מעקב דלק",
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
      key: "operation",
      label: "פעולה",
      type: "reference",
      searchable: true,
      getValue: (row) => row.operationName ?? row.operation,
    },
    {
      key: "fuelTank",
      label: "מיכל דלק",
      type: "reference",
      searchable: true,
      getValue: (row) => row.fuelTankName ?? row.fuelTank,
    },
    {
      key: "amount",
      label: "כמות (ליטר)",
      type: "number",
      sortable: true,
      width: "8rem",
    },
    {
      key: "tractor",
      label: "טרקטור/כלים",
      type: "reference",
      searchable: true,
      getValue: (row) => row.tractorName ?? row.tractor,
    },
    {
      key: "employee",
      label: "עובד",
      type: "reference",
      searchable: true,
      getValue: (row) => row.employeeName ?? row.employee,
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
    createTitle: "הוספת פעולת דלק",
    editTitle: "עריכת פעולת דלק",
    fields: [
      { key: "date", label: "תאריך", type: "date", required: true },
      {
        key: "operation",
        label: "פעולה",
        type: "reference",
        required: true,
        referenceCollection: "operations",
        referenceFilter: (row) => String(row.operationType ?? "") === "דלק",
      },
      {
        key: "fuelTank",
        label: "מיכל דלק",
        type: "reference",
        required: true,
        referenceCollection: "fuelTanks",
      },
      { key: "amount", label: "כמות (ליטר)", type: "number", required: true },
      {
        key: "tractor",
        label: "טרקטור/כלים",
        type: "reference",
        referenceCollection: "tractors",
      },
      {
        key: "employee",
        label: "עובד",
        type: "reference",
        referenceCollection: "employees",
      },
      { key: "notes", label: "הערות", type: "textarea" },
    ],
  },
};
