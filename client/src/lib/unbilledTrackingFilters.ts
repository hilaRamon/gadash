import type { CollectionDocument } from "@/schema/types";

export function isUncharged(row: CollectionDocument): boolean {
  return row.wasCharged !== true;
}
