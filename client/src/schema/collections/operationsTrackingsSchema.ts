import type {
  CollectionDocument,
  CollectionSchema,
  FormFieldDef,
  FormSchema,
} from "../types";
import { formatNumber } from "../../lib/formatNumber";

const nonFuelOperationFilter = (row: CollectionDocument) =>
  String(row.operationType ?? "") !== "דלק";

const fieldWorkOperationFilter = (row: CollectionDocument) =>
  String(row.operationType ?? "") === "עיבוד";

const adminOperationFilter = (row: CollectionDocument) =>
  String(row.operationType ?? "") === "מנהלה";

function operationFormField(
  referenceFilter: (row: CollectionDocument) => boolean,
  options?: { hidden?: boolean },
): FormFieldDef {
  return {
    key: "operation",
    label: "פעולה",
    type: "reference",
    required: true,
    referenceCollection: "operations",
    referenceFilter,
    hidden: options?.hidden,
  };
}

function buildOperationsTrackingForm(
  operationFilter: (row: CollectionDocument) => boolean,
  titles: { createTitle: string; editTitle: string },
  options?: { hideOperation?: boolean; hidePlotAndBillable?: boolean },
): FormSchema {
  const hidePlotAndBillable = options?.hidePlotAndBillable === true;

  return {
    ...titles,
    fields: [
      { key: "date", label: "תאריך", type: "date", required: true },
      operationFormField(operationFilter, { hidden: options?.hideOperation }),
      {
        key: "plot",
        label: "חלקה",
        type: "reference",
        required: !hidePlotAndBillable,
        referenceCollection: "plots",
        hidden: hidePlotAndBillable,
        defaultValue: null,
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
        key: "billable",
        label: "לחיוב",
        type: "boolean",
        hidden: hidePlotAndBillable,
        defaultValue: false,
      },
      {
        key: "wasCharged",
        label: "חויב",
        type: "boolean",
        hidden: true,
        defaultValue: false,
      },
      { key: "notes", label: "הערות", type: "textarea" },
    ],
  };
}

function formatDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("he-IL");
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
    key: "finalPrice",
    label: "מחיר סופי",
    type: "number",
    sortable: true,
    format: (value) => formatNumber(value),
    width: "8rem",
  },
  {
    key: "billable",
    label: "לחיוב",
    type: "boolean",
    sortable: true,
    format: (value) => (value === false ? "לא" : "כן"),
    width: "6rem",
    inlineEditable: (row) => String(row.operationType ?? "") !== "מנהלה",
  },
  {
    key: "notes",
    label: "הערות",
    type: "text",
    searchable: true,
  },
];

const adminColumns = baseColumns.filter(
  (column) =>
    !["customer", "plot", "billable", "finalPrice"].includes(column.key),
);

export const operationsTrackingsAllSchema: CollectionSchema = {
  id: "operations-trackings-all",
  collection: "operationsTrackings",
  label: "משימות - הכל",
  columns: baseColumns,
  defaultSort: { field: "date", direction: "desc" },
  form: buildOperationsTrackingForm(nonFuelOperationFilter, {
    createTitle: "הוספת משימה",
    editTitle: "עריכת משימה",
  }),
};

export const operationsTrackingsFieldWorkSchema: CollectionSchema = {
  id: "operations-trackings-field-work",
  collection: "operationsTrackings",
  label: "משימות - עיבודים",
  columns: baseColumns,
  defaultSort: { field: "date", direction: "desc" },
  form: buildOperationsTrackingForm(fieldWorkOperationFilter, {
    createTitle: "הוספת משימת עיבוד",
    editTitle: "עריכת משימת עיבוד",
  }),
};

export const operationsTrackingsAdminSchema: CollectionSchema = {
  id: "operations-trackings-admin",
  collection: "operationsTrackings",
  label: "משימות - מנהלות",
  columns: adminColumns,
  defaultSort: { field: "date", direction: "desc" },
  form: buildOperationsTrackingForm(
    adminOperationFilter,
    {
      createTitle: "הוספת משימת מנהלה",
      editTitle: "עריכת משימת מנהלה",
    },
    { hideOperation: true, hidePlotAndBillable: true },
  ),
};

