import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument } from './toApiDocument';

function toIsoDate(value: unknown): string {
  if (value == null || value === '') return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function invoiceToApiDocument(doc: Record<string, unknown>): ApiDocument {
  const base = toApiDocument(doc);

  return {
    ...base,
    date: toIsoDate(doc.date) || new Date().toISOString().slice(0, 10),
    invoiceNumber: String(doc.invoiceNumber ?? ''),
    companyName: String(doc.companyName ?? ''),
    amount: Number(doc.amount ?? 0),
    dueDate: toIsoDate(doc.dueDate),
    paid: doc.paid === true,
    notes: String(doc.notes ?? ''),
    hasFile: doc.fileKey != null && doc.fileKey !== '',
    fileName: doc.fileName != null ? String(doc.fileName) : null,
  };
}

export function invoiceToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(invoiceToApiDocument);
}
