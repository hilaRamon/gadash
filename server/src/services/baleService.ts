import { baleRepository, type BaleInput } from '../repositories/baleRepository';
import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

function pickNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toInput(body: Record<string, unknown>): BaleInput {
  const name = String(body.name ?? '').trim();
  if (!name) {
    throw new Error('שם הוא שדה חובה');
  }

  return {
    name,
    pricePerTon: pickNumber(body.pricePerTon),
    pricePerUnit: pickNumber(body.pricePerUnit),
  };
}

export const baleService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await baleRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = toInput(body);
    const created = await baleRepository.create(fields);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = toInput(body);
    const updated = await baleRepository.update(id, fields);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await baleRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await baleRepository.deleteMany(ids);
  },
};
