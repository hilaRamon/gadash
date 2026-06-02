import {
  supplierRepository,
  type SupplierInput,
} from '../repositories/supplierRepository';
import type { ApiDocument } from '../types/apiDocument';
import { pickMobileFromBody } from '../utils/mobileFormat';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

function pickSupplierFields(body: Record<string, unknown>): SupplierInput {
  return {
    name: String(body.name ?? ''),
    mobile: pickMobileFromBody(body),
    email: String(body.email ?? ''),
  };
}

export const supplierService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await supplierRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickSupplierFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }

    const created = await supplierRepository.create(fields);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickSupplierFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }

    const updated = await supplierRepository.update(id, fields);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await supplierRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await supplierRepository.deleteMany(ids);
  },
};
