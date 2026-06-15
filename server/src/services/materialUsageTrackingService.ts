import { Types } from 'mongoose';
import { EmployeeModel } from '../models/Employee';
import { MaterialModel } from '../models/Material';
import { PlotModel } from '../models/Plot';
import {
  materialUsageTrackingRepository,
  type MaterialUsageTrackingInput,
} from '../repositories/materialUsageTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import { assertTrackingNotCharged } from '../utils/assertTrackingNotCharged';
import {
  materialUsageTrackingToApiDocument,
  materialUsageTrackingToApiDocuments,
} from '../utils/materialUsageTrackingApiMapper';

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

function parseNotes(value: unknown): string {
  return String(value ?? '').trim();
}

function parseBillable(value: unknown): boolean {
  if (value == null || value === '') return true;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('לחיוב לא תקין');
}

function parseWasCharged(value: unknown): boolean {
  if (value == null || value === '') return false;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('חויב לא תקין');
}

async function resolveMaterialObjectId(materialId: unknown): Promise<Types.ObjectId> {
  const id = String(materialId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('חומר לא נמצא');
  }
  const material = await MaterialModel.findById(id).select('_id').lean();
  if (!material?._id) {
    throw new Error('חומר לא נמצא');
  }
  return material._id as Types.ObjectId;
}

async function resolvePlotObjectId(plotId: unknown): Promise<Types.ObjectId> {
  const id = String(plotId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('חלקה לא נמצאה');
  }
  const plot = await PlotModel.findById(id).select('_id customer').lean();
  if (!plot?._id) {
    throw new Error('חלקה לא נמצאה');
  }
  if (!plot.customer) {
    throw new Error('לא נמצא לקוח לחלקה שנבחרה');
  }
  return plot._id as Types.ObjectId;
}

async function resolveEmployeeObjectId(employeeId: unknown): Promise<Types.ObjectId> {
  const id = String(employeeId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('עובד לא נמצא');
  }
  const employee = await EmployeeModel.findById(id).select('_id').lean();
  if (!employee?._id) {
    throw new Error('עובד לא נמצא');
  }
  return employee._id as Types.ObjectId;
}

async function decrementMaterialQuantity(materialId: Types.ObjectId, amount: number) {
  const material = await MaterialModel.findById(materialId)
    .select('_id currentQuantity')
    .lean();
  if (!material) {
    throw new Error('חומר לא נמצא');
  }

  const currentQuantity = Number(material.currentQuantity ?? 0);
  const nextQuantity = Number((currentQuantity - amount).toFixed(3));
  if (nextQuantity < 0) {
    throw new Error('אין מספיק כמות זמינה בחומר');
  }

  await MaterialModel.findByIdAndUpdate(
    material._id,
    { $set: { currentQuantity: nextQuantity } },
    { runValidators: true },
  );
}

async function buildTrackingPatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Promise<Partial<MaterialUsageTrackingInput>> {
  const { requireAll = false } = options;
  const patch: Partial<MaterialUsageTrackingInput> = {};
  const mustHave = (key: string) => requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('date')) {
    patch.date = parseDate(body.date);
  }
  if (mustHave('material')) {
    patch.material = await resolveMaterialObjectId(body.material);
  }
  if (mustHave('plot')) {
    patch.plot = await resolvePlotObjectId(body.plot);
  }
  if (mustHave('employee')) {
    patch.employee = await resolveEmployeeObjectId(body.employee);
  }
  if (mustHave('amount')) {
    patch.amount = parsePositiveNumber(body.amount, 'כמות');
  }
  if (mustHave('notes')) {
    patch.notes = parseNotes(body.notes);
  }
  if (mustHave('billable')) {
    patch.billable = parseBillable(body.billable);
  }
  if (mustHave('wasCharged')) {
    patch.wasCharged = parseWasCharged(body.wasCharged);
  }

  return patch;
}

export const materialUsageTrackingService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await materialUsageTrackingRepository.findAll();
    return materialUsageTrackingToApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const patch = await buildTrackingPatch(body, { requireAll: true });
    if (
      patch.date == null ||
      patch.material == null ||
      patch.plot == null ||
      patch.employee == null ||
      patch.amount == null
    ) {
      throw new Error('שדות חובה חסרים');
    }

    const input: MaterialUsageTrackingInput = {
      date: patch.date,
      material: patch.material,
      plot: patch.plot,
      employee: patch.employee,
      amount: patch.amount,
      notes: patch.notes ?? '',
      billable: patch.billable ?? true,
      wasCharged: patch.wasCharged ?? false,
    };

    const created = await materialUsageTrackingRepository.create(input);
    try {
      await decrementMaterialQuantity(input.material, input.amount);
    } catch (error) {
      await materialUsageTrackingRepository.delete(String(created._id));
      throw error;
    }

    const populated = await materialUsageTrackingRepository.findById(String(created._id));
    return materialUsageTrackingToApiDocument(
      (populated ?? created.toObject()) as Record<string, unknown>,
    );
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const existing = await materialUsageTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }
    assertTrackingNotCharged(existing as { wasCharged?: boolean });

    const patch = await buildTrackingPatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    const updated = await materialUsageTrackingRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    return materialUsageTrackingToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await materialUsageTrackingRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await materialUsageTrackingRepository.deleteMany(ids);
  },
};
