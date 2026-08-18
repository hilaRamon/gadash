import {
  invoiceRepository,
  type InvoiceInput,
} from '../repositories/invoiceRepository';
import type { ApiDocument } from '../types/apiDocument';
import {
  invoiceToApiDocument,
  invoiceToApiDocuments,
} from '../utils/invoiceApiMapper';

function parseDate(value: unknown, label: string): Date {
  if (value == null || value === '') return new Date();
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} לא תקין`);
  }
  return date;
}

function parseDueDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  const monthMatch = raw.match(/^(\d{4})-(\d{2})(?:-\d{2})?/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    if (!Number.isInteger(year) || month < 1 || month > 12) {
      throw new Error('תאריך לתשלום לא תקין');
    }
    return new Date(Date.UTC(year, month - 1, 1));
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error('תאריך לתשלום לא תקין');
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function parseRequiredString(value: unknown, label: string): string {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new Error(`${label} חובה`);
  }
  return text;
}

function parseNotes(value: unknown): string {
  return String(value ?? '').trim();
}

function parseAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('סכום לא תקין');
  }
  return num;
}

function parsePaid(value: unknown): boolean {
  if (value == null || value === '') return false;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('שולם לא תקין');
}

function buildInvoicePatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Partial<InvoiceInput> {
  const { requireAll = false } = options;
  const patch: Partial<InvoiceInput> = {};
  const mustHave = (key: string) =>
    requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('date')) {
    patch.date = parseDate(body.date, 'תאריך');
  }
  if (mustHave('invoiceNumber')) {
    patch.invoiceNumber = parseRequiredString(body.invoiceNumber, 'מספר חשבונית');
  }
  if (mustHave('companyName')) {
    patch.companyName = parseRequiredString(body.companyName, 'שם החברה');
  }
  if (mustHave('amount')) {
    patch.amount = parseAmount(body.amount);
  }
  if (mustHave('dueDate')) {
    patch.dueDate = parseDueDate(body.dueDate);
  }
  if (mustHave('paid')) {
    patch.paid = parsePaid(body.paid);
  }
  if (mustHave('notes')) {
    patch.notes = parseNotes(body.notes);
  }

  return patch;
}

export const invoiceService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await invoiceRepository.findAll();
    return invoiceToApiDocuments(rows as Record<string, unknown>[]);
  },

  async listPaginated(listQuery: import('../utils/listQuery').ListQuery) {
    const result = await invoiceRepository.findPaginated(listQuery);
    return {
      ...result,
      items: invoiceToApiDocuments(result.items as Record<string, unknown>[]),
    };
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const patch = buildInvoicePatch(body, { requireAll: true });
    if (
      patch.date == null ||
      patch.invoiceNumber == null ||
      patch.companyName == null ||
      patch.amount == null
    ) {
      throw new Error('שדות חובה חסרים');
    }
    const input: InvoiceInput = {
      date: patch.date,
      invoiceNumber: patch.invoiceNumber,
      companyName: patch.companyName,
      amount: patch.amount,
      dueDate: patch.dueDate ?? null,
      paid: patch.paid ?? false,
      notes: patch.notes ?? '',
    };
    const created = await invoiceRepository.create(input);
    return invoiceToApiDocument(created.toObject() as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const existing = await invoiceRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    const patch = buildInvoicePatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    const updated = await invoiceRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    return invoiceToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await invoiceRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    const uniqueIds = [
      ...new Set(ids.map((id) => String(id ?? '').trim()).filter(Boolean)),
    ];
    if (uniqueIds.length === 0) return;

    const rows = await Promise.all(
      uniqueIds.map((rowId) => invoiceRepository.findById(rowId)),
    );
    if (rows.some((row) => row == null)) {
      throw new Error('לא נמצא');
    }

    await invoiceRepository.deleteMany(uniqueIds);
  },

  async monthlySummary(month: string): Promise<{
    month: string;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
  }> {
    const match = String(month ?? '').trim().match(/^(\d{4})-(\d{2})$/);
    const year = match ? Number(match[1]) : NaN;
    const monthNum = match ? Number(match[2]) : NaN;
    if (
      !match ||
      !Number.isInteger(year) ||
      !Number.isInteger(monthNum) ||
      monthNum < 1 ||
      monthNum > 12
    ) {
      throw new Error('חודש לא תקין');
    }

    const start = new Date(Date.UTC(year, monthNum - 1, 1));
    const endExclusive = new Date(Date.UTC(year, monthNum, 1));
    const { totalAmount, paidAmount } = await invoiceRepository.sumByDueMonth(
      start,
      endExclusive,
    );

    return {
      month: `${year}-${String(monthNum).padStart(2, '0')}`,
      totalAmount,
      paidAmount,
      unpaidAmount: totalAmount - paidAmount,
    };
  },
};
