import type { ApiDocument } from '../src/types/apiDocument';

export function toSeedInput<T extends Record<string, unknown>>(
  rows: ApiDocument[],
): T[] {
  return rows.map((row) => {
    const { _id, id: _legacyId, ...rest } = row;
    return rest as T;
  });
}
