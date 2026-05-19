import {
  tractorRepository,
  type TractorInput,
} from '../repositories/tractorRepository';
import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

function pickTractorFields(body: Record<string, unknown>): TractorInput {
  return {
    licenseNumber: String(body.licenseNumber ?? ''),
    name: String(body.name ?? ''),
  };
}

export const tractorService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await tractorRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickTractorFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }
    if (!fields.licenseNumber.trim()) {
      throw new Error("מס' רישוי הוא שדה חובה");
    }

    const created = await tractorRepository.create(fields);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickTractorFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }
    if (!fields.licenseNumber.trim()) {
      throw new Error("מס' רישוי הוא שדה חובה");
    }

    const updated = await tractorRepository.update(id, fields);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await tractorRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await tractorRepository.deleteMany(ids);
  },
};
