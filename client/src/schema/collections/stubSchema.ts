import { dataCollections, trackingCollections } from "../../config/navigation";
import { textColumn } from "../columnHelpers";
import type { CollectionSchema } from "../types";

export function createStubSchema(
  id: string,
  collection: string,
  label: string,
): CollectionSchema {
  return {
    id,
    collection,
    label,
    columns: [
      textColumn("name", "שם"),
      textColumn("notes", "הערות", { searchable: true }),
    ],
    defaultSort: { field: "name", direction: "asc" },
    form: {
      createTitle: `הוספת ${label}`,
      editTitle: `עריכת ${label}`,
      fields: [
        { key: "name", label: "שם", type: "text", required: true },
        { key: "notes", label: "הערות", type: "textarea" },
      ],
    },
  };
}

const dedicatedSchemaIds = new Set([
  "employees",
  "customers",
  "contractors",
  "suppliers",
  "operations",
  "materials",
  "bales",
  "tractors",
  "plots",
  "seasons",
  "fuel-tanks",
  "material-purchase-trackings",
  "material-usage-trackings",
  "operations-trackings-all",
  "operations-trackings-field-work",
  "operations-trackings-admin",
  "fuel-operations-trackings",
]);

export const stubSchemas: CollectionSchema[] = [
  ...dataCollections,
  ...trackingCollections,
]
  .filter((item) => !dedicatedSchemaIds.has(item.id))
  .map((item) => createStubSchema(item.id, item.collection, item.label));
