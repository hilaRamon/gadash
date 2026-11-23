import {
  contractorRepository,
  type ContractorInput,
} from '../repositories/contractorRepository';
import type { ApiDocument } from '../types/apiDocument';
import { pickMobileFromBody } from '../utils/mobileFormat';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

function hasKey(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function pickContractorFields(body: Record<string, unknown>): ContractorInput {
  return {
    name: String(body.name ?? ''),
    mobile: pickMobileFromBody(body),
    email: String(body.email ?? ''),
    notes: String(body.notes ?? ''),
  };
}

function pickContractorPatch(body: Record<string, unknown>): Partial<ContractorInput> {
  const patch: Partial<ContractorInput> = {};
  if (hasKey(body, 'name')) {
    const name = String(body.name ?? '');
    if (!name.trim()) {
      throw new Error('שם הוא שדה חובה');
    }
    patch.name = name;
  }
  if (hasKey(body, 'mobile')) {
    patch.mobile = pickMobileFromBody(body);
  }
  if (hasKey(body, 'email')) {
    patch.email = String(body.email ?? '');
  }
  if (hasKey(body, 'notes')) {
    patch.notes = String(body.notes ?? '');
  }
  return patch;
}

export const contractorService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await contractorRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async listPaginated(listQuery: import('../utils/listQuery').ListQuery) {
    const result = await contractorRepository.findPaginated(listQuery);
    return {
      ...result,
      items: toApiDocuments(result.items as Record<string, unknown>[]),
    };
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
    const patch = pickContractorPatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    const updated = await contractorRepository.update(id, patch);
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
