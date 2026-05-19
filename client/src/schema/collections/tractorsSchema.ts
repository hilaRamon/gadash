import { textColumn } from "../columnHelpers";
import type { CollectionSchema } from "../types";

export const tractorsSchema: CollectionSchema = {
  id: "tractors",
  collection: "tractors",
  label: "כלים (טרקטורים)",
  columns: [
    textColumn("name", "שם", { searchable: true }),
    textColumn("licenseNumber", "מס' רישוי", { searchable: true }),
  ],
  defaultSort: { field: "name", direction: "asc" },
  form: {
    createTitle: "הוספת כלי",
    editTitle: "עריכת כלי",
    fields: [
      { key: "name", label: "שם", type: "text", required: true },
      {
        key: "licenseNumber",
        label: "מס' רישוי",
        type: "text",
        required: true,
      },
    ],
  },
};
