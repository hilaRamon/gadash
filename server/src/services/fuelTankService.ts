import {
  fuelTankRepository,
  type FuelTankInput,
} from '../repositories/fuelTankRepository';
import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

function pickName(body: Record<string, unknown>): string {
  return String(body.name ?? '').trim();
}

function toInput(name: string): FuelTankInput {
  if (!name) {
    throw new Error('שם הוא שדה חובה');
  }
  return { name };
}

export const fuelTankService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await fuelTankRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = toInput(pickName(body));
    const created = await fuelTankRepository.create(fields);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = toInput(pickName(body));
    const updated = await fuelTankRepository.update(id, fields);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await fuelTankRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await fuelTankRepository.deleteMany(ids);
  },
};
