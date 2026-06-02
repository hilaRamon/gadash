import type { CollectionSchema, FormSchema } from "../types";

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("he-IL");
}

function formatCurrency(value: unknown): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "";
  return amount.toLocaleString("he-IL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const baseColumns: CollectionSchema["columns"] = [
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
    key: "customer",
    label: "לקוח",
    type: "reference",
    searchable: true,
    getValue: (row) => row.customerName ?? row.customer,
  },
  {
    key: "plot",
    label: "חלקה",
    type: "reference",
    searchable: true,
    getValue: (row) => row.plotName ?? row.plot,
  },
  {
    key: "employee",
    label: "עובד",
    type: "reference",
    searchable: true,
    getValue: (row) => row.employeeName ?? row.employee,
  },
  {
    key: "startTime",
    label: "שעת התחלה",
    type: "text",
    searchable: true,
    width: "6.5rem",
  },
  {
    key: "endTime",
    label: "שעת סיום",
    type: "text",
    searchable: true,
    width: "6.5rem",
  },
  {
    key: "tractor",
    label: "טרקטור",
    type: "reference",
    searchable: true,
    getValue: (row) => row.tractorName ?? row.tractor,
  },
  {
    key: "finalPrice",
    label: "מחיר סופי",
    type: "number",
    sortable: true,
    format: (value) => formatCurrency(value),
    width: "8rem",
  },
  {
    key: "billable",
    label: "לחיוב",
    type: "boolean",
    sortable: true,
    format: (value) => (value === false ? "לא" : "כן"),
    width: "6rem",
  },
  {
    key: "notes",
    label: "הערות",
    type: "text",
    searchable: true,
  },
];

const baseForm: FormSchema = {
  fields: [
    { key: "date", label: "תאריך", type: "date", required: true },
    {
      key: "operation",
      label: "פעולה",
      type: "reference",
      required: true,
      referenceCollection: "operations",
    },
    {
      key: "plot",
      label: "חלקה",
      type: "reference",
      required: true,
      referenceCollection: "plots",
    },
    {
      key: "employee",
      label: "עובד",
      type: "reference",
      required: true,
      referenceCollection: "employees",
    },
    { key: "startTime", label: "שעת התחלה", type: "time", required: true },
    { key: "endTime", label: "שעת סיום", type: "time", required: true },
    {
      key: "tractor",
      label: "טרקטור",
      type: "reference",
      required: true,
      referenceCollection: "tractors",
    },
    { key: "billable", label: "לחיוב", type: "boolean" },
    { key: "notes", label: "הערות", type: "textarea" },
  ],
};

export const operationsTrackingsAllSchema: CollectionSchema = {
  id: "operations-trackings-all",
  collection: "operationsTrackings",
  label: "משימות - הכל",
  columns: [
    ...baseColumns,
    {
      key: "operationType",
      label: "סוג פעולה",
      type: "text",
      searchable: true,
      width: "7rem",
    },
  ],
  defaultSort: { field: "date", direction: "desc" },
  form: {
    ...baseForm,
    createTitle: "הוספת משימה",
    editTitle: "עריכת משימה",
  },
};

export const operationsTrackingsFieldWorkSchema: CollectionSchema = {
  id: "operations-trackings-field-work",
  collection: "operationsTrackings",
  label: "משימות - עיבודים",
  columns: baseColumns,
  defaultSort: { field: "date", direction: "desc" },
  form: {
    ...baseForm,
    createTitle: "הוספת משימת עיבוד",
    editTitle: "עריכת משימת עיבוד",
  },
};

export const operationsTrackingsAdminSchema: CollectionSchema = {
  id: "operations-trackings-admin",
  collection: "operationsTrackings",
  label: "משימות - מנהלות",
  columns: baseColumns,
  defaultSort: { field: "date", direction: "desc" },
  form: {
    ...baseForm,
    createTitle: "הוספת משימת מנהלה",
    editTitle: "עריכת משימת מנהלה",
  },
};
