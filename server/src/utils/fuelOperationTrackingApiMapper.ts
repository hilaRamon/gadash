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

export function fuelOperationTrackingToApiDocument(doc: Record<string, unknown>): ApiDocument {
  const base = toApiDocument(doc);
  const operation = toRefParts(doc.operation);
  const fuelTank = toRefParts(doc.fuelTank);
  const employee = toRefParts(doc.employee);
  const tractor = toRefParts(doc.tractor);
  const dateValue = doc.date == null ? new Date() : new Date(String(doc.date));

  return {
    ...base,
    date: Number.isNaN(dateValue.getTime())
      ? new Date().toISOString().slice(0, 10)
      : dateValue.toISOString().slice(0, 10),
    operation: operation.id,
    operationName: operation.name,
    fuelTank: fuelTank.id,
    fuelTankName: fuelTank.name,
    employee: employee.id,
    employeeName: employee.name,
    tractor: tractor.id,
    tractorName: tractor.name,
  };
}

export function fuelOperationTrackingToApiDocuments(
  docs: Record<string, unknown>[],
): ApiDocument[] {
  return docs.map(fuelOperationTrackingToApiDocument);
}
