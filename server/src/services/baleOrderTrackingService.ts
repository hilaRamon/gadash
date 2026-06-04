import { Types } from 'mongoose';
import { BaleModel } from '../models/Bale';
import { CustomerModel } from '../models/Customer';
import {
  baleOrderTrackingRepository,
  type BaleOrderTrackingInput,
} from '../repositories/baleOrderTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import {
  baleOrderTrackingToApiDocument,
  baleOrderTrackingToApiDocuments,
} from '../utils/baleOrderTrackingApiMapper';

function parseDate(value: unknown): Date {
  if (value == null || value === '') return new Date();
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('תאריך לא תקין');
  }
  return date;
}

function parsePositiveNumber(value: unknown, label: string): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`${label} לא תקין`);
  }
  return num;
}

function parseOptionalPositiveNumber(value: unknown, label: string): number | null {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`${label} לא תקין`);
  }
  return num;
}

function parseOptionalString(value: unknown): string {
  return String(value ?? '').trim();
}

function parseNotes(value: unknown): string {
  return parseOptionalString(value);
}

function parseWeighed(value: unknown): boolean {
  if (value == null || value === '') return false;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('נשקל לא תקין');
}

async function resolveBaleObjectId(baleId: unknown): Promise<Types.ObjectId> {
  const id = String(baleId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('סוג חבילה לא נמצא');
  }
  const bale = await BaleModel.findById(id).select('_id').lean();
  if (!bale?._id) {
    throw new Error('סוג חבילה לא נמצא');
  }
  return bale._id as Types.ObjectId;
}

async function getBaleDefaultPrices(baleId: Types.ObjectId): Promise<{
  pricePerTon: number;
  pricePerUnit: number;
}> {
  const bale = await BaleModel.findById(baleId).select('pricePerTon pricePerUnit').lean();
  if (!bale) {
    throw new Error('סוג חבילה לא נמצא');
  }
  return {
    pricePerTon: parsePositiveNumber(bale.pricePerTon, 'מחיר לטון'),
    pricePerUnit: parsePositiveNumber(bale.pricePerUnit, 'מחיר ליחידה'),
  };
}

function bodyHasPriceField(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key) && body[key] !== '';
}

async function resolveStoredPrices(
  body: Record<string, unknown>,
  baleId: Types.ObjectId,
  options: { requireAll?: boolean } = {},
): Promise<{ pricePerTon: number; pricePerUnit: number }> {
  const { requireAll = false } = options;
  const defaults = await getBaleDefaultPrices(baleId);

  const hasTon = requireAll || bodyHasPriceField(body, 'pricePerTon');
  const hasUnit = requireAll || bodyHasPriceField(body, 'pricePerUnit');

  return {
    pricePerTon: hasTon
      ? parsePositiveNumber(body.pricePerTon, 'מחיר לטון')
      : defaults.pricePerTon,
    pricePerUnit: hasUnit
      ? parsePositiveNumber(body.pricePerUnit, 'מחיר ליחידה')
      : defaults.pricePerUnit,
  };
}

async function resolveCustomerObjectId(customerId: unknown): Promise<Types.ObjectId> {
  const id = String(customerId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('לקוח לא נמצא');
  }
  const customer = await CustomerModel.findById(id).select('_id').lean();
  if (!customer?._id) {
    throw new Error('לקוח לא נמצא');
  }
  return customer._id as Types.ObjectId;
}

async function buildTrackingPatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Promise<Partial<BaleOrderTrackingInput>> {
  const { requireAll = false } = options;
  const patch: Partial<BaleOrderTrackingInput> = {};
  const mustHave = (key: string) => requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('date')) {
    patch.date = parseDate(body.date);
  }
  if (mustHave('bale')) {
    patch.bale = await resolveBaleObjectId(body.bale);
  }
  if (mustHave('customer')) {
    patch.customer = await resolveCustomerObjectId(body.customer);
  }
  if (mustHave('quantity')) {
    patch.quantity = parsePositiveNumber(body.quantity, 'כמות');
  }
  if (mustHave('pricePerTon')) {
    patch.pricePerTon = parsePositiveNumber(body.pricePerTon, 'מחיר לטון');
  }
  if (mustHave('pricePerUnit')) {
    patch.pricePerUnit = parsePositiveNumber(body.pricePerUnit, 'מחיר ליחידה');
  }
  if (mustHave('weight')) {
    patch.weight = parseOptionalPositiveNumber(body.weight, 'משקל');
  }
  if (mustHave('transportPrice')) {
    patch.transportPrice = parseOptionalPositiveNumber(body.transportPrice, 'מחיר הובלה');
  }
  if (mustHave('weighed')) {
    patch.weighed = parseWeighed(body.weighed);
  }
  if (mustHave('notes')) {
    patch.notes = parseNotes(body.notes);
  }

  return patch;
}

export const baleOrderTrackingService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await baleOrderTrackingRepository.findAll();
    return baleOrderTrackingToApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const patch = await buildTrackingPatch(body, { requireAll: true });
    if (
      patch.date == null ||
      patch.bale == null ||
      patch.customer == null ||
      patch.quantity == null
    ) {
      throw new Error('שדות חובה חסרים');
    }

    const prices = await resolveStoredPrices(body, patch.bale, { requireAll: false });

    const input: BaleOrderTrackingInput = {
      date: patch.date,
      bale: patch.bale,
      customer: patch.customer,
      quantity: patch.quantity,
      pricePerTon: prices.pricePerTon,
      pricePerUnit: prices.pricePerUnit,
      weight: patch.weight ?? null,
      transportPrice: patch.transportPrice ?? null,
      weighed: patch.weighed ?? false,
      notes: patch.notes ?? '',
    };

    const created = await baleOrderTrackingRepository.create(input);
    const populated = await baleOrderTrackingRepository.findById(String(created._id));
    return baleOrderTrackingToApiDocument(
      (populated ?? created.toObject()) as Record<string, unknown>,
    );
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const patch = await buildTrackingPatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    const existing = await baleOrderTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    const baleChanged = patch.bale != null;
    const pricesTouched =
      bodyHasPriceField(body, 'pricePerTon') || bodyHasPriceField(body, 'pricePerUnit');

    if (baleChanged || pricesTouched) {
      const baleId = (patch.bale ?? existing.bale) as Types.ObjectId;
      const prices = await resolveStoredPrices(body, baleId, { requireAll: pricesTouched });
      patch.pricePerTon = prices.pricePerTon;
      patch.pricePerUnit = prices.pricePerUnit;
    }

    const updated = await baleOrderTrackingRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    return baleOrderTrackingToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await baleOrderTrackingRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await baleOrderTrackingRepository.deleteMany(ids);
  },
};
