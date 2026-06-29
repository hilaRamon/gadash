import {
  fuelTankRepository,
  type FuelTankInput,
} from '../repositories/fuelTankRepository';
import type { ApiDocument } from '../types/apiDocument';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';
import { roundQuantity } from '../utils/quantityPrecision';

function pickName(body: Record<string, unknown>): string {
  return String(body.name ?? '').trim();
}

function pickCurrentAmount(body: Record<string, unknown>): unknown {
  return body.currentAmount;
}

function parseCurrentAmount(value: unknown): number {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('כמות נוכחית לא תקינה');
  }
  return roundQuantity(num);
}

function toInput(name: string, currentAmountValue: unknown): FuelTankInput {
  if (!name) {
    throw new Error('שם הוא שדה חובה');
  }
  return {
    name,
    currentAmount: parseCurrentAmount(currentAmountValue),
  };
}

export const fuelTankService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await fuelTankRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = toInput(pickName(body), pickCurrentAmount(body));
    const created = await fuelTankRepository.create(fields);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = toInput(pickName(body), pickCurrentAmount(body));
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
