import { Types } from 'mongoose';
import { MaterialModel } from '../models/Material';
import { SupplierModel } from '../models/Supplier';
import {
  materialPurchaseTrackingRepository,
  type MaterialPurchaseTrackingInput,
} from '../repositories/materialPurchaseTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import {
  materialPurchaseTrackingToApiDocument,
  materialPurchaseTrackingToApiDocuments,
} from '../utils/materialPurchaseTrackingApiMapper';

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

function parsePositiveNumber(value: unknown, label: string): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`${label} לא תקין`);
  }
  return num;
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

async function resolveSupplierObjectId(supplierId: unknown): Promise<Types.ObjectId> {
  const id = String(supplierId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('ספק לא נמצא');
  }
  const supplier = await SupplierModel.findById(id).select('_id').lean();
  if (!supplier?._id) {
    throw new Error('ספק לא נמצא');
  }
  return supplier._id as Types.ObjectId;
}

function calcFinalPrice(unitPrice: number, amount: number): number {
  return Number((unitPrice * amount).toFixed(3));
}

function parseNotes(value: unknown): string {
  return String(value ?? '').trim();
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

async function syncMaterialQuantityAfterPurchaseUpdate(
  existing: Record<string, unknown>,
  patch: Partial<MaterialPurchaseTrackingInput>,
) {
  const oldMaterialId = toMaterialObjectId(existing.material);
  const oldAmount = Number(existing.amount ?? 0);
  const newMaterialId = patch.material ?? oldMaterialId;
  const newAmount = patch.amount ?? oldAmount;

  if (String(oldMaterialId) === String(newMaterialId)) {
    if (patch.amount == null) return;
    await applyMaterialQuantityDelta(newMaterialId, newAmount - oldAmount);
    return;
  }

  await applyMaterialQuantityDelta(oldMaterialId, -oldAmount);
  await applyMaterialQuantityDelta(newMaterialId, newAmount);
}

async function syncMaterialAfterPurchaseCreate(input: MaterialPurchaseTrackingInput) {
  const material = await MaterialModel.findById(input.material).lean();
  if (!material) {
    throw new Error('חומר לא נמצא');
  }

  const nextQuantity = Number(material.currentQuantity ?? 0) + input.amount;
  const currentBuyingCost = Number(material.currentBuyingCost ?? 0);
  const shouldUpdateCost = currentBuyingCost !== input.unitPrice;

  const update: {
    $set: {
      currentQuantity: number;
      currentBuyingCost?: number;
    };
    $push?: {
      pricingHistory: {
        cost: number;
        percent: number;
        effectiveFrom: Date;
      };
    };
  } = {
    $set: {
      currentQuantity: Number(nextQuantity.toFixed(3)),
    },
  };

  if (shouldUpdateCost) {
    update.$set.currentBuyingCost = input.unitPrice;
    update.$push = {
      pricingHistory: {
        cost: input.unitPrice,
        percent: Number(material.currentSalePercent ?? 15),
        effectiveFrom: input.date,
      },
    };
  }

  await MaterialModel.findByIdAndUpdate(material._id, update, {
    runValidators: true,
  });
}

async function buildTrackingPatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Promise<Partial<MaterialPurchaseTrackingInput>> {
  const { requireAll = false } = options;
  const patch: Partial<MaterialPurchaseTrackingInput> = {};
  const mustHave = (key: string) => requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('date')) {
    patch.date = parseDate(body.date);
  }

  if (mustHave('material')) {
    patch.material = await resolveMaterialObjectId(body.material);
  }

  if (mustHave('supplier')) {
    patch.supplier = await resolveSupplierObjectId(body.supplier);
  }

  if (mustHave('unitPrice')) {
    patch.unitPrice = parsePositiveNumber(body.unitPrice, 'מחיר לקג/ליטר');
  }

  if (mustHave('amount')) {
    patch.amount = parseNumber(body.amount, 'כמות');
  }

  if (mustHave('notes')) {
    patch.notes = parseNotes(body.notes);
  }

  const unitPrice = patch.unitPrice;
  const amount = patch.amount;
  if (unitPrice != null && amount != null) {
    patch.finalPrice = calcFinalPrice(unitPrice, amount);
  }

  return patch;
}

export const materialPurchaseTrackingService = {
  async list(seasonYear?: number): Promise<ApiDocument[]> {
    const rows = await materialPurchaseTrackingRepository.findAll(seasonYear);
    return materialPurchaseTrackingToApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const patch = await buildTrackingPatch(body, { requireAll: true });
    if (
      patch.date == null ||
      patch.material == null ||
      patch.supplier == null ||
      patch.unitPrice == null ||
      patch.amount == null
    ) {
      throw new Error('שדות חובה חסרים');
    }
    const input: MaterialPurchaseTrackingInput = {
      date: patch.date,
      material: patch.material,
      supplier: patch.supplier,
      unitPrice: patch.unitPrice,
      amount: patch.amount,
      finalPrice: calcFinalPrice(patch.unitPrice, patch.amount),
      notes: patch.notes ?? '',
    };
    const created = await materialPurchaseTrackingRepository.create(input);
    try {
      await syncMaterialAfterPurchaseCreate(input);
    } catch (error) {
      await materialPurchaseTrackingRepository.delete(String(created._id));
      throw error;
    }
    const populated = await materialPurchaseTrackingRepository.findById(String(created._id));
    return materialPurchaseTrackingToApiDocument(
      (populated ?? created.toObject()) as Record<string, unknown>,
    );
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const existing = await materialPurchaseTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    const patch = await buildTrackingPatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    if (patch.unitPrice != null || patch.amount != null) {
      const unitPrice = patch.unitPrice ?? Number(existing.unitPrice ?? 0);
      const amount = patch.amount ?? Number(existing.amount ?? 0);
      patch.finalPrice = calcFinalPrice(unitPrice, amount);
    }

    if (patch.amount != null || patch.material != null) {
      await syncMaterialQuantityAfterPurchaseUpdate(
        existing as Record<string, unknown>,
        patch,
      );
    }

    const updated = await materialPurchaseTrackingRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    return materialPurchaseTrackingToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await materialPurchaseTrackingRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await materialPurchaseTrackingRepository.deleteMany(ids);
  },
};
