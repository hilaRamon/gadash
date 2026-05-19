import type { ApiDocument } from '../types/apiDocument';

export function toApiDocument(doc: Record<string, unknown>): ApiDocument {
  const { __v, id: _legacyId, ...rest } = doc;
  if (rest._id != null) {
    rest._id = String(rest._id);
  }
  return rest as ApiDocument;
}

export function toApiDocuments(docs: Record<string, unknown>[]): ApiDocument[] {
  return docs.map(toApiDocument);
}
