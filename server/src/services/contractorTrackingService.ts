import { Types } from 'mongoose';
import {
  CONTRACTOR_PRICING_FORMS,
  type ContractorPricingForm,
} from '../models/ContractorTracking';
import { ContractorModel } from '../models/Contractor';
import { OperationModel } from '../models/Operation';
import { PlotModel } from '../models/Plot';
import {
  contractorTrackingRepository,
  type ContractorTrackingInput,
} from '../repositories/contractorTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import {
  contractorTrackingToApiDocument,
  contractorTrackingToApiDocuments,
} from '../utils/contractorTrackingApiMapper';
import {
  calcFinalPrice,
  resolveUnitAmount,
} from '../utils/contractorTrackingPricing';

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
  return parsePositiveNumber(value, label);
}

function parsePricingForm(value: unknown): ContractorPricingForm {
  const raw = String(value ?? '').trim();
  if (!CONTRACTOR_PRICING_FORMS.includes(raw as ContractorPricingForm)) {
    throw new Error('צורת תמחור לא תקינה');
  }
  return raw as ContractorPricingForm;
}

function parseTime(value: unknown, label: string): string | null {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  if (!/^([01]?\d|2[0-3]):([0-5]\d)$/.test(raw)) {
    throw new Error(`${label} לא תקינה`);
  }
  return raw.padStart(5, '0');
}

function parseNotes(value: unknown): string {
  return String(value ?? '').trim();
}

async function resolveContractorObjectId(contractorId: unknown): Promise<Types.ObjectId> {
  const id = String(contractorId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('קבלן לא נמצא');
  }
  const contractor = await ContractorModel.findById(id).select('_id').lean();
  if (!contractor?._id) {
    throw new Error('קבלן לא נמצא');
  }
  return contractor._id as Types.ObjectId;
}

async function resolvePlotObjectId(plotId: unknown): Promise<Types.ObjectId> {
  const id = String(plotId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('חלקה לא נמצאה');
  }
  const plot = await PlotModel.findById(id).select('_id').lean();
  if (!plot?._id) {
    throw new Error('חלקה לא נמצאה');
  }
  return plot._id as Types.ObjectId;
}

async function resolveOperationObjectId(operationId: unknown): Promise<Types.ObjectId> {
  const id = String(operationId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('פעולה לא נמצאה');
  }
  const operation = await OperationModel.findById(id).select('_id').lean();
  if (!operation?._id) {
    throw new Error('פעולה לא נמצאה');
  }
  return operation._id as Types.ObjectId;
}

async function buildTrackingPatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Promise<Partial<ContractorTrackingInput>> {
  const { requireAll = false } = options;
  const patch: Partial<ContractorTrackingInput> = {};
  const mustHave = (key: string) => requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('date')) {
    patch.date = parseDate(body.date);
  }
  if (mustHave('contractor')) {
    patch.contractor = await resolveContractorObjectId(body.contractor);
  }
  if (mustHave('plot')) {
    patch.plot = await resolvePlotObjectId(body.plot);
  }
  if (mustHave('operation')) {
    patch.operation = await resolveOperationObjectId(body.operation);
  }
  if (mustHave('pricingForm')) {
    patch.pricingForm = parsePricingForm(body.pricingForm);
  }
  if (mustHave('startTime')) {
    patch.startTime = parseTime(body.startTime, 'שעת התחלה');
  }
  if (mustHave('endTime')) {
    patch.endTime = parseTime(body.endTime, 'שעת סיום');
  }
  if (mustHave('unitPrice')) {
    patch.unitPrice = parsePositiveNumber(body.unitPrice, 'מחיר ליחידה');
  }
  if (mustHave('unitAmount')) {
    patch.unitAmount = parsePositiveNumber(body.unitAmount, 'כמות יחידות');
  }
  if (mustHave('customerPrice')) {
    patch.customerPrice = parseOptionalPositiveNumber(body.customerPrice, 'מחיר ללקוח');
  }
  if (mustHave('notes')) {
    patch.notes = parseNotes(body.notes);
  }

  if (patch.pricingForm != null) {
    patch.unitAmount = resolveUnitAmount(patch.pricingForm, {
      startTime: patch.startTime,
      endTime: patch.endTime,
      unitAmount: patch.unitAmount,
    });
  }

  const unitPrice = patch.unitPrice;
  const unitAmount = patch.unitAmount;
  if (unitPrice != null && unitAmount != null) {
    patch.finalPrice = calcFinalPrice(unitPrice, unitAmount);
  }

  return patch;
}

export const contractorTrackingService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await contractorTrackingRepository.findAll();
    return contractorTrackingToApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const patch = await buildTrackingPatch(body, { requireAll: true });
    if (
      patch.date == null ||
      patch.contractor == null ||
      patch.plot == null ||
      patch.operation == null ||
      patch.pricingForm == null ||
      patch.unitPrice == null
    ) {
      throw new Error('שדות חובה חסרים');
    }

    const unitAmount = resolveUnitAmount(patch.pricingForm, {
      startTime: patch.startTime,
      endTime: patch.endTime,
      unitAmount: patch.unitAmount,
    });

    const input: ContractorTrackingInput = {
      date: patch.date,
      contractor: patch.contractor,
      plot: patch.plot,
      operation: patch.operation,
      pricingForm: patch.pricingForm,
      startTime: patch.pricingForm === 'שעתי' ? patch.startTime ?? null : null,
      endTime: patch.pricingForm === 'שעתי' ? patch.endTime ?? null : null,
      unitPrice: patch.unitPrice,
      unitAmount,
      finalPrice: calcFinalPrice(patch.unitPrice, unitAmount),
      customerPrice: patch.customerPrice ?? null,
      notes: patch.notes ?? '',
    };

    const created = await contractorTrackingRepository.create(input);
    const populated = await contractorTrackingRepository.findById(String(created._id));
    return contractorTrackingToApiDocument(
      (populated ?? created.toObject()) as Record<string, unknown>,
    );
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const existing = await contractorTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    const patch = await buildTrackingPatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    const pricingForm =
      patch.pricingForm ?? (String(existing.pricingForm ?? '') as ContractorPricingForm);
    const startTime =
      pricingForm === 'שעתי'
        ? (patch.startTime ?? String(existing.startTime ?? ''))
        : null;
    const endTime =
      pricingForm === 'שעתי' ? (patch.endTime ?? String(existing.endTime ?? '')) : null;
    const unitPrice = patch.unitPrice ?? Number(existing.unitPrice ?? 0);

    patch.pricingForm = pricingForm;
    patch.startTime = startTime;
    patch.endTime = endTime;
    patch.unitAmount = resolveUnitAmount(pricingForm, {
      startTime,
      endTime,
      unitAmount: patch.unitAmount ?? Number(existing.unitAmount ?? 0),
    });
    patch.finalPrice = calcFinalPrice(unitPrice, patch.unitAmount);
    patch.unitPrice = unitPrice;

    if (pricingForm !== 'שעתי') {
      patch.startTime = null;
      patch.endTime = null;
    }

    const updated = await contractorTrackingRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    return contractorTrackingToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await contractorTrackingRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await contractorTrackingRepository.deleteMany(ids);
  },
};
