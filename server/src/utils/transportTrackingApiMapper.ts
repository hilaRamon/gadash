import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument } from './toApiDocument';

type PopulatedRef = {
  _id?: unknown;
  name?: string;
};

function toRefParts(value: unknown): { id: string; name: string } {
  const ref = value as PopulatedRef | undefined;
  if (ref && typeof ref === 'object' && ref._id != null) {
    return {
      id: String(ref._id),
      name: String(ref.name ?? ''),
    };
  }
  return {
    id: value == null ? '' : String(value),
    name: '',
  };
}

export function transportTrackingToApiDocument(doc: Record<string, unknown>): ApiDocument {
  const base = toApiDocument(doc);
  const mover = toRefParts(doc.mover);
  const dateValue = doc.date == null ? new Date() : new Date(String(doc.date));

  return {
    ...base,
    date: Number.isNaN(dateValue.getTime())
      ? new Date().toISOString().slice(0, 10)
      : dateValue.toISOString().slice(0, 10),
    mover: mover.id,
    moverName: mover.name,
  };
}

export function transportTrackingToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(transportTrackingToApiDocument);
}
