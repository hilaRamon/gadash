import type { CollectionSchema } from "../types";

export const agriculturalSeasonsSchema: CollectionSchema = {
  id: "seasons",
  collection: "agriculturalSeasons",
  label: "עונות חקלאיות",
  columns: [
    {
      key: "year",
      label: "שנה",
      type: "text",
      searchable: true,
      sortable: true,
      width: "5rem",
    },
  ],
  defaultSort: { field: "year", direction: "desc" },
  form: {
    createTitle: "הוספת עונה",
    editTitle: "עריכת עונה",
    fields: [{ key: "year", label: "שנה", type: "number", required: true }],
  },
};
