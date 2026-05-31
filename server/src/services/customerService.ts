import {
  customerRepository,
  type CustomerInput,
} from '../repositories/customerRepository';
import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

function pickCustomerFields(body: Record<string, unknown>): CustomerInput {
  const customerNumber = Number(body.customerNumber);
  return {
    customerNumber: Number.isFinite(customerNumber) ? customerNumber : 0,
    name: String(body.name ?? ''),
    mobile: String(body.mobile ?? ''),
    email: String(body.email ?? ''),
    notes: String(body.notes ?? ''),
  };
}

export const customerService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await customerRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickCustomerFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }
    if (!fields.customerNumber) {
      throw new Error('מספר לקוח הוא שדה חובה');
    }

    const created = await customerRepository.create(fields);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickCustomerFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }
    if (!fields.customerNumber) {
      throw new Error('מספר לקוח הוא שדה חובה');
    }

    const updated = await customerRepository.update(id, fields);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await customerRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await customerRepository.deleteMany(ids);
  },
};
