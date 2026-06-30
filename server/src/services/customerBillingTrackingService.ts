import { Types } from 'mongoose';
import {
  CUSTOMER_BILLING_STATUSES,
  type CustomerBillingStatus,
} from '../models/CustomerBillingTracking';
import { CustomerModel } from '../models/Customer';
import {
  customerBillingTrackingRepository,
  type CustomerBillingTrackingInput,
} from '../repositories/customerBillingTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import { PAID_BILLING_DELETE_ERROR, GLOBAL_TRANSPORT_BILLING_DELETE_ERROR } from '../lib/customerBillingErrors';
import {
  customerBillingTrackingToApiDocument,
  customerBillingTrackingToApiDocuments,
} from '../utils/customerBillingTrackingApiMapper';
import { unchargeBillingLineItems } from './customerBillingLineItemsService';

function parseDate(value: unknown): Date {
  if (value == null || value === '') return new Date();
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('תאריך לא תקין');
  }
  return date;
}

function parseNotes(value: unknown): string {
  return String(value ?? '').trim();
}

function parseStatus(value: unknown): CustomerBillingStatus {
  const raw = String(value ?? '').trim();
  if (!CUSTOMER_BILLING_STATUSES.includes(raw as CustomerBillingStatus)) {
    throw new Error('סטטוס לא תקין');
  }
  return raw as CustomerBillingStatus;
}

function parsePositiveNumber(value: unknown, label: string): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`${label} לא תקין`);
  }
  return num;
}

function parseObjectIdArray(value: unknown, label: string): Types.ObjectId[] {
  if (value == null || value === '') return [];
  if (!Array.isArray(value)) {
    throw new Error(`${label} לא תקין`);
  }
  const ids = value.map((item) => String(item ?? '').trim()).filter(Boolean);
  for (const id of ids) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`${label} לא תקין`);
    }
  }
  return ids.map((id) => new Types.ObjectId(id));
}

function parsePaid(value: unknown): boolean {
  if (value == null || value === '') return false;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('שולם לא תקין');
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
): Promise<Partial<CustomerBillingTrackingInput>> {
  const { requireAll = false } = options;
  const patch: Partial<CustomerBillingTrackingInput> = {};
  const mustHave = (key: string) =>
    requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('date')) {
    patch.date = parseDate(body.date);
  }
  if (mustHave('customer')) {
    patch.customer = await resolveCustomerObjectId(body.customer);
  }
  if (mustHave('notes')) {
    patch.notes = parseNotes(body.notes);
  }
  if (mustHave('status')) {
    if (body.status == null || body.status === '') {
      patch.status = 'לא אושר כלל';
    } else {
      patch.status = parseStatus(body.status);
    }
  }
  if (mustHave('paid')) {
    patch.paid = parsePaid(body.paid);
  }
  if (mustHave('finalPrice')) {
    patch.finalPrice = parsePositiveNumber(body.finalPrice, 'סכום סופי');
  }
  if (mustHave('operationsTrackingIds')) {
    patch.operationsTrackingIds = parseObjectIdArray(
      body.operationsTrackingIds,
      'מעקבי פעולות',
    );
  }
  if (mustHave('materialUsageTrackingIds')) {
    patch.materialUsageTrackingIds = parseObjectIdArray(
      body.materialUsageTrackingIds,
      'מעקבי שימוש בחומרים',
    );
  }
  if (mustHave('contractorTrackingIds')) {
    patch.contractorTrackingIds = parseObjectIdArray(
      body.contractorTrackingIds,
      'מעקבי קבלנים',
    );
  }
  if (mustHave('baleOrderTrackingIds')) {
    patch.baleOrderTrackingIds = parseObjectIdArray(
      body.baleOrderTrackingIds,
      'מעקבי הזמנות חבילות',
    );
  }
  if (mustHave('transportTrackingIds')) {
    patch.transportTrackingIds = parseObjectIdArray(
      body.transportTrackingIds,
      'מעקבי הובלות',
    );
  }

  return patch;
}

export const customerBillingTrackingService = {
  async list(seasonYear?: number): Promise<ApiDocument[]> {
    const rows = await customerBillingTrackingRepository.findAll(seasonYear);
    return customerBillingTrackingToApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const patch = await buildTrackingPatch(body, { requireAll: true });
    if (
      patch.date == null ||
      patch.customer == null ||
      patch.status == null ||
      patch.finalPrice == null
    ) {
      throw new Error('שדות חובה חסרים');
    }

    const input: CustomerBillingTrackingInput = {
      date: patch.date,
      customer: patch.customer,
      notes: patch.notes ?? '',
      status: patch.status,
      paid: patch.paid ?? false,
      finalPrice: patch.finalPrice,
      operationsTrackingIds: patch.operationsTrackingIds ?? [],
      materialUsageTrackingIds: patch.materialUsageTrackingIds ?? [],
      contractorTrackingIds: patch.contractorTrackingIds ?? [],
      baleOrderTrackingIds: patch.baleOrderTrackingIds ?? [],
      transportTrackingIds: patch.transportTrackingIds ?? [],
    };

    const created = await customerBillingTrackingRepository.create(input);
    const populated = await customerBillingTrackingRepository.findById(String(created._id));
    return customerBillingTrackingToApiDocument(
      (populated ?? created.toObject()) as Record<string, unknown>,
    );
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const existing = await customerBillingTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    const patch = await buildTrackingPatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    const updated = await customerBillingTrackingRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    return customerBillingTrackingToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const existing = await customerBillingTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }
    if (existing.paid === true) {
      throw new Error(PAID_BILLING_DELETE_ERROR);
    }
    if (String(existing.billKind ?? '') === 'globalTransport') {
      throw new Error(GLOBAL_TRANSPORT_BILLING_DELETE_ERROR);
    }

    await unchargeBillingLineItems(existing as Record<string, unknown>);
    await customerBillingTrackingRepository.delete(id);
  },

  async removeMany(ids: string[]): Promise<void> {
    const uniqueIds = [...new Set(ids.map((id) => String(id ?? '').trim()).filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const rows = await customerBillingTrackingRepository.findByIds(uniqueIds);
    if (rows.length !== uniqueIds.length) {
      throw new Error('לא נמצא');
    }
    if (rows.some((row) => row.paid === true)) {
      throw new Error(PAID_BILLING_DELETE_ERROR);
    }
    if (rows.some((row) => String(row.billKind ?? '') === 'globalTransport')) {
      throw new Error(GLOBAL_TRANSPORT_BILLING_DELETE_ERROR);
    }

    await Promise.all(
      rows.map((row) =>
        unchargeBillingLineItems(row as Record<string, unknown>),
      ),
    );
    await customerBillingTrackingRepository.deleteMany(uniqueIds);
  },
};
