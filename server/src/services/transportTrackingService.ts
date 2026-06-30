import { Types } from 'mongoose';
import { MoverModel } from '../models/Mover';
import { CustomerModel } from '../models/Customer';
import {
  transportTrackingRepository,
  type TransportTrackingInput,
} from '../repositories/transportTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import {
  transportTrackingToApiDocument,
  transportTrackingToApiDocuments,
} from '../utils/transportTrackingApiMapper';
import {
  calcFinalPrice,
  calcHoursBetween,
} from '../utils/transportTrackingPricing';
import {
  DEFAULT_TRANSPORT_BILLING,
  TRANSPORT_BILLING_TYPES,
  TRANSPORT_CUSTOMER_BILLING,
  type TransportBillingType,
} from '../models/TransportTracking';
import { assertTrackingNotCharged } from '../utils/assertTrackingNotCharged';

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

function parseTime(value: unknown, label: string): string {
  const raw = String(value ?? '').trim();
  if (!/^([01]?\d|2[0-3]):([0-5]\d)$/.test(raw)) {
    throw new Error(`${label} לא תקינה`);
  }
  return raw.padStart(5, '0');
}

function parseNotes(value: unknown): string {
  return String(value ?? '').trim();
}

function parseWasCharged(value: unknown): boolean {
  if (value == null || value === '') return false;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('חויב לא תקין');
}

function parseBilling(value: unknown): TransportBillingType {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return DEFAULT_TRANSPORT_BILLING;
  }
  if (!(TRANSPORT_BILLING_TYPES as readonly string[]).includes(raw)) {
    throw new Error('חיוב לא תקין');
  }
  return raw as TransportBillingType;
}

async function resolveMoverObjectId(moverId: unknown): Promise<Types.ObjectId> {
  const id = String(moverId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('מוביל לא נמצא');
  }
  const mover = await MoverModel.findById(id).select('_id').lean();
  if (!mover?._id) {
    throw new Error('מוביל לא נמצא');
  }
  return mover._id as Types.ObjectId;
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

async function resolveCustomerForBilling(
  billing: TransportBillingType,
  customerId: unknown,
): Promise<Types.ObjectId | null> {
  if (billing !== TRANSPORT_CUSTOMER_BILLING) {
    return null;
  }
  return resolveCustomerObjectId(customerId);
}

function resolveHours(startTime: string, endTime: string): number {
  return calcHoursBetween(startTime, endTime);
}

async function buildTrackingPatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Promise<Partial<TransportTrackingInput>> {
  const { requireAll = false } = options;
  const patch: Partial<TransportTrackingInput> = {};
  const mustHave = (key: string) => requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('date')) {
    patch.date = parseDate(body.date);
  }
  if (mustHave('mover')) {
    patch.mover = await resolveMoverObjectId(body.mover);
  }
  if (mustHave('startTime')) {
    patch.startTime = parseTime(body.startTime, 'שעת התחלה');
  }
  if (mustHave('endTime')) {
    patch.endTime = parseTime(body.endTime, 'שעת סיום');
  }
  if (mustHave('hourlyRate')) {
    patch.hourlyRate = parsePositiveNumber(body.hourlyRate, 'מחיר לשעה');
  }
  if (mustHave('notes')) {
    patch.notes = parseNotes(body.notes);
  }
  if (mustHave('billing')) {
    patch.billing = parseBilling(body.billing);
  }
  if (mustHave('wasCharged')) {
    patch.wasCharged = parseWasCharged(body.wasCharged);
  }

  if (patch.startTime != null && patch.endTime != null) {
    patch.hours = resolveHours(patch.startTime, patch.endTime);
  }

  const hourlyRate = patch.hourlyRate;
  const hours = patch.hours;
  if (hourlyRate != null && hours != null) {
    patch.finalPrice = calcFinalPrice(hourlyRate, hours);
  }

  return patch;
}

export const transportTrackingService = {
  async list(seasonYear?: number): Promise<ApiDocument[]> {
    const rows = await transportTrackingRepository.findAll(seasonYear);
    return transportTrackingToApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const patch = await buildTrackingPatch(body, { requireAll: true });
    if (
      patch.date == null ||
      patch.mover == null ||
      patch.startTime == null ||
      patch.endTime == null ||
      patch.hourlyRate == null
    ) {
      throw new Error('שדות חובה חסרים');
    }

    const hours = resolveHours(patch.startTime, patch.endTime);
    const billing = patch.billing ?? DEFAULT_TRANSPORT_BILLING;

    const input: TransportTrackingInput = {
      date: patch.date,
      mover: patch.mover,
      startTime: patch.startTime,
      endTime: patch.endTime,
      hourlyRate: patch.hourlyRate,
      hours,
      finalPrice: calcFinalPrice(patch.hourlyRate, hours),
      billing,
      customer: await resolveCustomerForBilling(billing, body.customer),
      notes: patch.notes ?? '',
      wasCharged: patch.wasCharged ?? false,
    };

    const created = await transportTrackingRepository.create(input);
    const populated = await transportTrackingRepository.findById(String(created._id));
    return transportTrackingToApiDocument(
      (populated ?? created.toObject()) as Record<string, unknown>,
    );
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const existing = await transportTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }
    assertTrackingNotCharged(existing as { wasCharged?: boolean });

    const patch = await buildTrackingPatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    const startTime = patch.startTime ?? String(existing.startTime ?? '');
    const endTime = patch.endTime ?? String(existing.endTime ?? '');
    const hourlyRate = patch.hourlyRate ?? Number(existing.hourlyRate ?? 0);

    patch.startTime = startTime;
    patch.endTime = endTime;
    patch.hourlyRate = hourlyRate;
    patch.hours = resolveHours(startTime, endTime);
    patch.finalPrice = calcFinalPrice(hourlyRate, patch.hours);

    const billing = (patch.billing ??
      String(existing.billing ?? DEFAULT_TRANSPORT_BILLING)) as TransportBillingType;

    if (billing === TRANSPORT_CUSTOMER_BILLING) {
      if (Object.prototype.hasOwnProperty.call(body, 'customer')) {
        patch.customer = body.customer
          ? await resolveCustomerObjectId(body.customer)
          : null;
      }
      const effectiveCustomer =
        patch.customer !== undefined ? patch.customer : existing.customer;
      if (!effectiveCustomer) {
        throw new Error('לקוח נדרש');
      }
    } else if (patch.billing != null || Object.prototype.hasOwnProperty.call(body, 'customer')) {
      patch.customer = null;
    }

    const updated = await transportTrackingRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    return transportTrackingToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await transportTrackingRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await transportTrackingRepository.deleteMany(ids);
  },
};
