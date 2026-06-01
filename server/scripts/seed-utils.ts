import type { ApiDocument } from '../src/types/apiDocument';
import { tryNormalizeMobile } from '../src/utils/mobileFormat';

export function toSeedInput<T extends Record<string, unknown>>(
  rows: ApiDocument[],
): T[] {
  return rows.map((row) => {
    const { _id, id: _legacyId, ...rest } = row;
    const normalized = { ...rest } as Record<string, unknown>;

    if (typeof normalized.mobile === 'string' && normalized.mobile.trim()) {
      const result = tryNormalizeMobile(normalized.mobile);
      if (result.ok) {
        normalized.mobile = result.value;
      }
    }

    return normalized as T;
  });
}
