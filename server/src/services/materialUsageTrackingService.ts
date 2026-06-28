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
import { calcCustomerCost } from '../utils/materialPricing';
import { calcMaterialUsageAmount } from '../utils/materialUsageAmount';

function parseDate(value: unknown): Date {
  if (value == null || value === '') return new Date();
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('תאריך לא תקין');
  }
  return date;
}

function parseNumber(value: unknown, label: string): number {
  const num = Number(value);
  if (!Number.isFinite(num)) {
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

function parseUnitPrice(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('מחיר לק״ג לא תקין');
  }
  return num;
}

async function resolveMaterialUnitPrice(
  materialId: Types.ObjectId,
): Promise<number | null> {
  const material = await MaterialModel.findById(materialId)
    .select('currentBuyingCost currentSalePercent')
    .lean();
  if (!material) return null;
  const cost = Number(material.currentBuyingCost ?? 0);
  const percent = Number(material.currentSalePercent ?? 15);
  return calcCustomerCost(cost, percent);
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

async function applyMaterialQuantityDelta(materialId: Types.ObjectId, delta: number) {
  if (delta === 0) return;

  const material = await MaterialModel.findById(materialId)
    .select('_id currentQuantity')
    .lean();
  if (!material) {
    throw new Error('חומר לא נמצא');
  }

  const nextQuantity = Number(
    (Number(material.currentQuantity ?? 0) + delta).toFixed(3),
  );

  await MaterialModel.findByIdAndUpdate(
    material._id,
    { $set: { currentQuantity: nextQuantity } },
    { runValidators: true },
  );
}

function toMaterialObjectId(value: unknown): Types.ObjectId {
  if (value && typeof value === 'object' && '_id' in value) {
    return value._id as Types.ObjectId;
  }
  return value as Types.ObjectId;
}

async function syncMaterialQuantityAfterUsageUpdate(
  existing: Record<string, unknown>,
  patch: Partial<MaterialUsageTrackingInput>,
) {
  const oldMaterialId = toMaterialObjectId(existing.material);
  const oldAmount = Number(existing.amount ?? 0);
  const newMaterialId = patch.material ?? oldMaterialId;
  const newAmount = patch.amount ?? oldAmount;

  if (String(oldMaterialId) === String(newMaterialId)) {
    if (patch.amount == null) return;
    await applyMaterialQuantityDelta(oldMaterialId, oldAmount - newAmount);
    return;
  }

  await applyMaterialQuantityDelta(oldMaterialId, oldAmount);
  await applyMaterialQuantityDelta(newMaterialId, -newAmount);
}

async function decrementMaterialQuantity(materialId: Types.ObjectId, amount: number) {
  await applyMaterialQuantityDelta(materialId, -amount);
}

async function restoreMaterialQuantityAfterUsageDelete(
  existing: Record<string, unknown>,
): Promise<void> {
  const materialId = toMaterialObjectId(existing.material);
  const amount = Number(existing.amount ?? 0);
  await applyMaterialQuantityDelta(materialId, amount);
}

async function resolveComputedUsageAmount(
  materialId: Types.ObjectId,
  plotId: Types.ObjectId,
): Promise<number | null> {
  const [material, plot] = await Promise.all([
    MaterialModel.findById(materialId).select('amountPerDunam').lean(),
    PlotModel.findById(plotId).select('dunam').lean(),
  ]);
  if (!material || !plot) return null;
  return calcMaterialUsageAmount(
    Number(plot.dunam ?? 0),
    material.amountPerDunam as number | null | undefined,
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
    if (body.amount != null && body.amount !== '') {
      patch.amount = parseNumber(body.amount, 'כמות');
    }
  } else if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
    if (body.amount == null || body.amount === '') {
      patch.amount = undefined;
    } else {
      patch.amount = parseNumber(body.amount, 'כמות');
    }
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
  if (Object.prototype.hasOwnProperty.call(body, 'unitPrice')) {
    patch.unitPrice =
      body.unitPrice == null || body.unitPrice === ''
        ? null
        : parseUnitPrice(body.unitPrice);
  }

  return patch;
}

export const materialUsageTrackingService = {
  async list(seasonYear?: number): Promise<ApiDocument[]> {
    const rows = await materialUsageTrackingRepository.findAll(seasonYear);
    return materialUsageTrackingToApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const patch = await buildTrackingPatch(body, { requireAll: true });
    if (
      patch.date == null ||
      patch.material == null ||
      patch.plot == null ||
      patch.employee == null
    ) {
      throw new Error('שדות חובה חסרים');
    }

    if (patch.amount == null) {
      const computed = await resolveComputedUsageAmount(patch.material, patch.plot);
      if (computed != null) {
        patch.amount = computed;
      }
    }

    if (patch.amount == null) {
      throw new Error('שדות חובה חסרים');
    }

    const input: MaterialUsageTrackingInput = {
      date: patch.date,
      material: patch.material,
      plot: patch.plot,
      employee: patch.employee,
      amount: patch.amount,
      unitPrice:
        patch.unitPrice !== undefined
          ? patch.unitPrice
          : await resolveMaterialUnitPrice(patch.material),
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

    const existingRecord = existing as Record<string, unknown>;
    const existingMaterialId = toMaterialObjectId(existingRecord.material);
    const existingPlotId = toMaterialObjectId(existingRecord.plot);
    const plotChanged =
      patch.plot != null && String(patch.plot) !== String(existingPlotId);
    const materialChanged =
      patch.material != null && String(patch.material) !== String(existingMaterialId);

    if (plotChanged || materialChanged) {
      const materialId = patch.material ?? existingMaterialId;
      const plotId = patch.plot ?? existingPlotId;
      const computed = await resolveComputedUsageAmount(materialId, plotId);
      if (computed != null) {
        patch.amount = computed;
      }
    }

    if (materialChanged) {
      const materialId = patch.material ?? existingMaterialId;
      const unitPrice = await resolveMaterialUnitPrice(materialId);
      if (unitPrice != null) {
        patch.unitPrice = unitPrice;
      }
    }

    if (patch.amount != null || patch.material != null) {
      await syncMaterialQuantityAfterUsageUpdate(
        existing as Record<string, unknown>,
        patch,
      );
    }

    const updated = await materialUsageTrackingRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    return materialUsageTrackingToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const existing = await materialUsageTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    await restoreMaterialQuantityAfterUsageDelete(existing as Record<string, unknown>);
    await materialUsageTrackingRepository.delete(id);
  },

  async removeMany(ids: string[]): Promise<void> {
    const uniqueIds = [...new Set(ids.map((id) => String(id ?? '').trim()).filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const rows = await Promise.all(
      uniqueIds.map((rowId) => materialUsageTrackingRepository.findById(rowId)),
    );
    if (rows.some((row) => row == null)) {
      throw new Error('לא נמצא');
    }

    for (const row of rows) {
      await restoreMaterialQuantityAfterUsageDelete(row as Record<string, unknown>);
    }
    await materialUsageTrackingRepository.deleteMany(uniqueIds);
  },
};
