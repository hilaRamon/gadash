import { moverRepository, type MoverInput } from '../repositories/moverRepository';
import type { ApiDocument } from '../types/apiDocument';
import { pickMobileFromBody } from '../utils/mobileFormat';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

function pickHourlyRate(value: unknown): number {
  if (value == null || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pickMoverFields(body: Record<string, unknown>): MoverInput {
  return {
    name: String(body.name ?? ''),
    mobile: pickMobileFromBody(body),
    email: String(body.email ?? ''),
    hourlyRate: pickHourlyRate(body.hourlyRate),
  };
}

export const moverService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await moverRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickMoverFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }

    const created = await moverRepository.create(fields);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = pickMoverFields(body);
    if (!fields.name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }

    const updated = await moverRepository.update(id, fields);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await moverRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await moverRepository.deleteMany(ids);
  },
};
