import { textColumn } from "../columnHelpers";
import type { CollectionSchema } from "../types";

export const materialsSchema: CollectionSchema = {
  id: "materials",
  collection: "materials",
  label: "חומרים",
  columns: [
    textColumn("name", "שם", { searchable: true }),
    {
      key: "currentBuyingCost",
      label: "מחיר קניה",
      type: "number",
      sortable: true,
      width: "6rem",
    },
    {
      key: "currentSalePercent",
      label: "אחוז מכירה",
      type: "number",
      sortable: true,
      width: "6rem",
      format: (value) => `${Number(value ?? 0)}%`,
    },
    {
      key: "customerCost",
      label: "מחיר ללקוח",
      type: "number",
      sortable: true,
      width: "6rem",
    },
    {
      key: "amountPerDunam",
      label: "כמות לדונם",
      type: "number",
      sortable: true,
      width: "6rem",
    },
    {
      key: "currentQuantity",
      label: "כמות נוכחית",
      type: "number",
      sortable: true,
      width: "6rem",
      highlightWhenNegative: true,
    },
  ],
  defaultSort: { field: "name", direction: "asc" },
  form: {
    createTitle: "הוספת חומר",
    editTitle: "עריכת חומר",
    fields: [
      { key: "name", label: "שם", type: "text", required: true },
      {
        key: "currentQuantity",
        label: "כמות נוכחית",
        type: "number",
        required: true,
      },
      {
        key: "currentBuyingCost",
        label: "מחיר קניה",
        type: "number",
        required: true,
      },
      { key: "currentSalePercent", label: "אחוז מכירה", type: "number" },
      { key: "amountPerDunam", label: "כמות לדונם", type: "number" },
    ],
  },
};
