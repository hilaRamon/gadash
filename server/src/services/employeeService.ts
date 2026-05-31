import {
  employeeRepository,
  type EmployeeInput,
} from '../repositories/employeeRepository';
import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

function pickEmployeeFields(body: Record<string, unknown>): EmployeeInput {
  return {
    name: String(body.name ?? ''),
    email: String(body.email ?? ''),
    mobile: String(body.mobile ?? ''),
    notes: String(body.notes ?? ''),
  };
}

export const employeeService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await employeeRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickEmployeeFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }

    const created = await employeeRepository.create(fields);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickEmployeeFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }

    const updated = await employeeRepository.update(id, fields);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await employeeRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await employeeRepository.deleteMany(ids);
  },
};
