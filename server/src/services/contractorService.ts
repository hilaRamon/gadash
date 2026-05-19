import {
  contractorRepository,
  type ContractorInput,
} from '../repositories/contractorRepository';
import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

function pickContractorFields(body: Record<string, unknown>): ContractorInput {
  return {
    name: String(body.name ?? ''),
    mobile: String(body.mobile ?? ''),
    email: String(body.email ?? ''),
    notes: String(body.notes ?? ''),
  };
}

export const contractorService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await contractorRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickContractorFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }

    const created = await contractorRepository.create(fields);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickContractorFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }

    const updated = await contractorRepository.update(id, fields);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await contractorRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await contractorRepository.deleteMany(ids);
  },
};
