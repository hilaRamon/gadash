import type { CollectionDocument } from "../schema/types";

export function isChargedTracking(row: CollectionDocument): boolean {
  return row.wasCharged === true;
}
