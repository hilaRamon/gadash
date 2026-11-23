import {
  employeeRepository,
  type EmployeeInput,
} from '../repositories/employeeRepository';
import { operationTrackingRepository } from '../repositories/operationTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import { pickMobileFromBody } from '../utils/mobileFormat';
import { getCurrentSeasonYear } from '../utils/seasonRange';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

function parseHourlyCost(value: unknown): number {
  if (value == null || value === '') return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('עלות לשעה לא תקינה');
  }
  return num;
}

function hasKey(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function pickEmployeeFields(body: Record<string, unknown>): EmployeeInput {
  return {
    name: String(body.name ?? ''),
    email: String(body.email ?? ''),
    mobile: pickMobileFromBody(body),
    notes: String(body.notes ?? ''),
    hourlyCost: parseHourlyCost(body.hourlyCost),
  };
}

function pickEmployeePatch(body: Record<string, unknown>): Partial<EmployeeInput> {
  const patch: Partial<EmployeeInput> = {};
  if (hasKey(body, 'name')) {
    const name = String(body.name ?? '');
    if (!name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }
    patch.name = name;
  }
  if (hasKey(body, 'email')) {
    patch.email = String(body.email ?? '');
  }
  if (hasKey(body, 'mobile')) {
    patch.mobile = pickMobileFromBody(body);
  }
  if (hasKey(body, 'notes')) {
    patch.notes = String(body.notes ?? '');
  }
  if (hasKey(body, 'hourlyCost')) {
    patch.hourlyCost = parseHourlyCost(body.hourlyCost);
  }
  return patch;
}

export const employeeService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await employeeRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async listPaginated(listQuery: import('../utils/listQuery').ListQuery) {
    const result = await employeeRepository.findPaginated(listQuery);
    return {
      ...result,
      items: toApiDocuments(result.items as Record<string, unknown>[]),
    };
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
    const patch = pickEmployeePatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    const existing = await employeeRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    const previousHourlyCost = Number(existing.hourlyCost ?? 0);
    const nextHourlyCost = Number(patch.hourlyCost ?? 0);
    const hourlyCostChanged =
      patch.hourlyCost != null && previousHourlyCost !== nextHourlyCost;

    const updated = await employeeRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    if (hourlyCostChanged) {
      await operationTrackingRepository.syncAdminUnitCostsForEmployeeHourlyCost({
        employeeId: id,
        seasonYear: getCurrentSeasonYear(),
        nextHourlyCost,
      });
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
