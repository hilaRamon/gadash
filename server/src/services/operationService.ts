import {
  OPERATION_TYPES,
  PRICING_FORMS,
  type NullablePricingForm,
  type OperationType,
} from '../models/Operation';
import {
  operationRepository,
  type OperationInput,
  type OperationMetadataPatch,
} from '../repositories/operationRepository';
import type { ApiDocument } from '../types/apiDocument';
import { deriveCurrentCost } from '../utils/deriveCurrentCost';
import { toApiDocument, toApiDocuments } from '../utils/toApiDocument';

const DEFAULT_EFFECTIVE_FROM = new Date('2025-01-01T00:00:00.000Z');

function parsePricingForm(value: unknown): NullablePricingForm {
  if (value == null || String(value).trim() === '') {
    return null;
  }
  const str = String(value ?? '').trim();
  if ((PRICING_FORMS as readonly string[]).includes(str)) {
    return str as NullablePricingForm;
  }
  throw new Error('צורת תמחור לא תקינה');
}

function parseOperationType(value: unknown): OperationType {
  const str = String(value ?? '').trim();
  if ((OPERATION_TYPES as readonly string[]).includes(str)) {
    return str as OperationType;
  }
  throw new Error('סוג פעולה לא תקין');
}

function parseCost(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('מחיר לא תקין');
  }
  return num;
}

function parseEffectiveFrom(value: unknown): Date {
  if (value == null || value === '') {
    return DEFAULT_EFFECTIVE_FROM;
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('תאריך תחולה לא תקין');
  }
  return date;
}

function buildOperationPatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Partial<OperationMetadataPatch> {
  const { requireAll = false } = options;
  const patch: Partial<OperationMetadataPatch> = {};

  const mustHave = (key: string) =>
    requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('name')) {
    const name = String(body.name ?? '').trim();
    if (!name) {
      throw new Error('שם הוא שדה חובה');
    }
    patch.name = name;
  }

  if (mustHave('pricingForm')) {
    patch.pricingForm = parsePricingForm(body.pricingForm);
  }

  if (mustHave('operationType')) {
    patch.operationType = parseOperationType(body.operationType);
  }

  if (requireAll) {
    const required: (keyof OperationMetadataPatch)[] = [
      'name',
      'operationType',
    ];
    for (const key of required) {
      if (patch[key] === undefined) {
        throw new Error('שדות חובה חסרים');
      }
    }
  }

  return patch;
}

function pickMetadataFields(body: Record<string, unknown>): OperationMetadataPatch {
  return buildOperationPatch(body, { requireAll: true }) as OperationMetadataPatch;
}

function buildInitialCostHistory(
  cost: number,
  effectiveFrom: Date,
): OperationInput['costHistory'] {
  return [{ cost, effectiveFrom }];
}

function hasCostField(body: Record<string, unknown>): boolean {
  return (
    Object.prototype.hasOwnProperty.call(body, 'currentCost') ||
    Object.prototype.hasOwnProperty.call(body, 'cost')
  );
}

function resolveEffectiveFrom(body: Record<string, unknown>): Date {
  if (body.effectiveFrom == null || body.effectiveFrom === '') {
    return new Date();
  }
  return parseEffectiveFrom(body.effectiveFrom);
}

async function applyCostChange(
  id: string,
  existing: { currentCost: number; costHistory: OperationInput['costHistory'] },
  body: Record<string, unknown>,
) {
  const cost = parseCost(body.currentCost ?? body.cost);
  if (cost === existing.currentCost) {
    return null;
  }

  const effectiveFrom = resolveEffectiveFrom(body);
  const duplicateDate = existing.costHistory.some(
    (entry) => entry.effectiveFrom.getTime() === effectiveFrom.getTime(),
  );
  if (duplicateDate) {
    throw new Error('כבר קיים מחיר בתאריך תחולה זה');
  }

  const nextHistory = [...existing.costHistory, { cost, effectiveFrom }];
  const currentCost = deriveCurrentCost(nextHistory);

  return operationRepository.appendCostChange(
    id,
    { cost, effectiveFrom },
    currentCost,
  );
}

export const operationService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await operationRepository.findAll();
    return toApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const metadata = pickMetadataFields(body);

    const cost = parseCost(body.currentCost ?? body.cost);
    const effectiveFrom = parseEffectiveFrom(body.effectiveFrom);
    const costHistory = buildInitialCostHistory(cost, effectiveFrom);

    const input: OperationInput = {
      ...metadata,
      currentCost: deriveCurrentCost(costHistory),
      costHistory,
    };

    const created = await operationRepository.create(input);
    return toApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const metadata = buildOperationPatch(body);
    const hasMetadata = Object.keys(metadata).length > 0;
    const hasCost = hasCostField(body);

    if (!hasMetadata && !hasCost) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    const existing = await operationRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    let updated = existing;
    if (hasMetadata) {
      const metadataResult = await operationRepository.updateMetadata(id, metadata);
      if (!metadataResult) {
        throw new Error('לא נמצא');
      }
      updated = metadataResult;
    }

    if (hasCost) {
      const costResult = await applyCostChange(id, updated, body);
      if (costResult) {
        updated = costResult;
      }
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async appendCostChange(
    id: string,
    body: Record<string, unknown>,
  ): Promise<ApiDocument> {
    const existing = await operationRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    const updated = await applyCostChange(id, existing, body);
    if (!updated) {
      throw new Error('המחיר לא השתנה');
    }

    return toApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await operationRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await operationRepository.deleteMany(ids);
  },
};
