import {
  materialRepository,
  type MaterialInput,
  type MaterialMetadataPatch,
} from '../repositories/materialRepository';
import type { ApiDocument } from '../types/apiDocument';
import {
  calcCustomerCost,
  deriveCurrentPricing,
} from '../utils/materialPricing';
import { toApiDocument } from '../utils/toApiDocument';

const DEFAULT_EFFECTIVE_FROM = new Date('2025-01-01T00:00:00.000Z');
const DEFAULT_SALE_PERCENT = 15;

function parseName(value: unknown): string {
  const name = String(value ?? '').trim();
  if (!name) {
    throw new Error('שם הוא שדה חובה');
  }
  return name;
}

function parseBuyingCost(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('מחיר קניה לא תקין');
  }
  return num;
}

function parseCurrentQuantity(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('כמות נוכחית לא תקינה');
  }
  return num;
}

function parseSalePercent(value: unknown): number {
  if (value == null || value === '') {
    return DEFAULT_SALE_PERCENT;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('אחוז מכירה לא תקין');
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

function resolveEffectiveFrom(body: Record<string, unknown>): Date {
  if (body.effectiveFrom == null || body.effectiveFrom === '') {
    return new Date();
  }
  return parseEffectiveFrom(body.effectiveFrom);
}

function withCustomerCost(doc: Record<string, unknown>): ApiDocument {
  const apiDoc = toApiDocument(doc);
  const buyingCost = Number(apiDoc.currentBuyingCost ?? 0);
  const salePercent = Number(apiDoc.currentSalePercent ?? DEFAULT_SALE_PERCENT);
  return {
    ...apiDoc,
    customerCost: calcCustomerCost(buyingCost, salePercent),
  };
}

function buildMetadataPatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Partial<MaterialMetadataPatch> {
  const { requireAll = false } = options;
  const patch: Partial<MaterialMetadataPatch> = {};
  const mustHave = (key: string) =>
    requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('name')) {
    patch.name = parseName(body.name);
  }
  if (mustHave('currentQuantity')) {
    patch.currentQuantity = parseCurrentQuantity(body.currentQuantity);
  }

  if (requireAll) {
    if (
      patch.name == null ||
      patch.currentQuantity == null
    ) {
      throw new Error('שדות חובה חסרים');
    }
  }
  return patch;
}

function hasPricingField(body: Record<string, unknown>): boolean {
  return (
    Object.prototype.hasOwnProperty.call(body, 'currentBuyingCost') ||
    Object.prototype.hasOwnProperty.call(body, 'cost') ||
    Object.prototype.hasOwnProperty.call(body, 'currentSalePercent') ||
    Object.prototype.hasOwnProperty.call(body, 'percent')
  );
}

async function applyPricingChange(
  id: string,
  existing: {
    currentBuyingCost: number;
    currentSalePercent: number;
    pricingHistory: MaterialInput['pricingHistory'];
  },
  body: Record<string, unknown>,
) {
  const nextCost =
    Object.prototype.hasOwnProperty.call(body, 'currentBuyingCost') ||
    Object.prototype.hasOwnProperty.call(body, 'cost')
      ? parseBuyingCost(body.currentBuyingCost ?? body.cost)
      : existing.currentBuyingCost;

  const nextPercent =
    Object.prototype.hasOwnProperty.call(body, 'currentSalePercent') ||
    Object.prototype.hasOwnProperty.call(body, 'percent')
      ? parseSalePercent(body.currentSalePercent ?? body.percent)
      : existing.currentSalePercent;

  const unchanged =
    nextCost === existing.currentBuyingCost &&
    nextPercent === existing.currentSalePercent;
  if (unchanged) {
    return null;
  }

  const effectiveFrom = resolveEffectiveFrom(body);
  const duplicateDate = existing.pricingHistory.some(
    (entry) => entry.effectiveFrom.getTime() === effectiveFrom.getTime(),
  );
  if (duplicateDate) {
    throw new Error('כבר קיים שינוי לתאריך תחולה זה');
  }

  const nextHistory = [
    ...existing.pricingHistory,
    { cost: nextCost, percent: nextPercent, effectiveFrom },
  ];
  const current = deriveCurrentPricing(nextHistory);

  return materialRepository.appendPricingChange(
    id,
    { cost: nextCost, percent: nextPercent, effectiveFrom },
    current.cost,
    current.percent,
  );
}

export const materialService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await materialRepository.findAll();
    return (rows as Record<string, unknown>[]).map(withCustomerCost);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const metadata = buildMetadataPatch(body, { requireAll: true }) as MaterialMetadataPatch;
    const cost = parseBuyingCost(body.currentBuyingCost ?? body.cost);
    const percent = parseSalePercent(body.currentSalePercent ?? body.percent);
    const effectiveFrom = parseEffectiveFrom(body.effectiveFrom);
    const pricingHistory: MaterialInput['pricingHistory'] = [
      { cost, percent, effectiveFrom },
    ];
    const current = deriveCurrentPricing(pricingHistory);

    const input: MaterialInput = {
      ...metadata,
      currentQuantity: metadata.currentQuantity,
      currentBuyingCost: current.cost,
      currentSalePercent: current.percent,
      pricingHistory,
    };

    const created = await materialRepository.create(input);
    return withCustomerCost(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const metadata = buildMetadataPatch(body);
    const hasMetadata = Object.keys(metadata).length > 0;
    const hasPricing = hasPricingField(body);
    if (!hasMetadata && !hasPricing) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    const existing = await materialRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    let updated = existing;
    if (hasMetadata) {
      const metadataResult = await materialRepository.updateMetadata(id, metadata);
      if (!metadataResult) {
        throw new Error('לא נמצא');
      }
      updated = metadataResult;
    }

    if (hasPricing) {
      const pricingResult = await applyPricingChange(id, updated, body);
      if (pricingResult) {
        updated = pricingResult;
      }
    }

    return withCustomerCost(updated as Record<string, unknown>);
  },

  async appendPricingChange(
    id: string,
    body: Record<string, unknown>,
  ): Promise<ApiDocument> {
    const existing = await materialRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    const updated = await applyPricingChange(id, existing, body);
    if (!updated) {
      throw new Error('לא נמצא שינוי במחיר או באחוז');
    }

    return withCustomerCost(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await materialRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await materialRepository.deleteMany(ids);
  },
};
