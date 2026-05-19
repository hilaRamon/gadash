import {
  agriculturalSeasonRepository,
  type AgriculturalSeasonInput,
} from '../repositories/agriculturalSeasonRepository';
import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

const YEAR_PATTERN = /^20\d{2}$/;

function pickYear(body: Record<string, unknown>): number {
  const raw = body.year;
  return typeof raw === 'number' ? raw : Number(raw);
}

function assertValidYear(year: number): void {
  if (!Number.isInteger(year) || !YEAR_PATTERN.test(String(year))) {
    throw new Error('שנה חייבת להיות מספר בן 4 ספרות המתחיל ב-20');
  }
}

function toInput(year: number): AgriculturalSeasonInput {
  assertValidYear(year);
  return { year };
}

export const agriculturalSeasonService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await agriculturalSeasonRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = toInput(pickYear(body));
    const created = await agriculturalSeasonRepository.create(fields);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = toInput(pickYear(body));
    const updated = await agriculturalSeasonRepository.update(id, fields);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await agriculturalSeasonRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await agriculturalSeasonRepository.deleteMany(ids);
  },
};
