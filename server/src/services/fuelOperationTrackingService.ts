import { Types } from 'mongoose';
import { EmployeeModel } from '../models/Employee';
import { FuelTankModel } from '../models/FuelTank';
import { OperationModel } from '../models/Operation';
import { TractorModel } from '../models/Tractor';
import {
  fuelOperationTrackingRepository,
  type FuelOperationTrackingInput,
} from '../repositories/fuelOperationTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import {
  fuelOperationTrackingToApiDocument,
  fuelOperationTrackingToApiDocuments,
} from '../utils/fuelOperationTrackingApiMapper';
import { roundQuantity } from '../utils/quantityPrecision';

type FuelDirection = 'decrement' | 'increment';

function parseDate(value: unknown): Date {
  if (value == null || value === '') return new Date();
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('תאריך לא תקין');
  }
  return date;
}

function parseAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('כמות לא תקינה');
  }
  return roundQuantity(num);
}

function parseNotes(value: unknown): string {
  return String(value ?? '').trim();
}

function parseOptionalObjectId(value: unknown, label: string): Types.ObjectId | null {
  const id = String(value ?? '').trim();
  if (!id) return null;
  if (!Types.ObjectId.isValid(id)) {
    throw new Error(`${label} לא נמצא`);
  }
  return new Types.ObjectId(id);
}

function resolveFuelDirectionByOperationName(name: string): FuelDirection {
  const operationName = name.trim();
  if (operationName === 'תדלוק') return 'decrement';
  if (operationName === 'מילוי מיכל') return 'increment';
  throw new Error('פעולת דלק חייבת להיות תדלוק או מילוי מיכל');
}

function signedFuelDelta(amount: number, direction: FuelDirection): number {
  return direction === 'decrement' ? -amount : amount;
}

function invertFuelDirection(direction: FuelDirection): FuelDirection {
  return direction === 'decrement' ? 'increment' : 'decrement';
}

function toFuelTankObjectId(value: unknown): Types.ObjectId {
  if (value && typeof value === 'object' && '_id' in value) {
    return value._id as Types.ObjectId;
  }
  return value as Types.ObjectId;
}

async function resolveFuelOperation(operationId: unknown): Promise<{
  id: Types.ObjectId;
  direction: FuelDirection;
}> {
  const id = String(operationId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('פעולה לא נמצאה');
  }
  const operation = await OperationModel.findById(id)
    .select('_id name operationType')
    .lean();
  if (!operation?._id) {
    throw new Error('פעולה לא נמצאה');
  }
  if (String(operation.operationType ?? '') !== 'דלק') {
    throw new Error('הפעולה שנבחרה אינה מסוג דלק');
  }
  return {
    id: operation._id as Types.ObjectId,
    direction: resolveFuelDirectionByOperationName(String(operation.name ?? '')),
  };
}

async function resolveDirectionFromExisting(
  existing: Record<string, unknown>,
): Promise<FuelDirection> {
  const operation = existing.operation;
  if (operation && typeof operation === 'object' && operation !== null && 'name' in operation) {
    return resolveFuelDirectionByOperationName(
      String((operation as { name?: string }).name ?? ''),
    );
  }
  const resolved = await resolveFuelOperation(existing.operation);
  return resolved.direction;
}

async function resolveFuelTankObjectId(fuelTankId: unknown): Promise<Types.ObjectId> {
  const id = String(fuelTankId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('מיכל דלק לא נמצא');
  }
  const tank = await FuelTankModel.findById(id).select('_id').lean();
  if (!tank?._id) {
    throw new Error('מיכל דלק לא נמצא');
  }
  return tank._id as Types.ObjectId;
}

async function resolveOptionalEmployeeObjectId(value: unknown): Promise<Types.ObjectId | null> {
  const id = parseOptionalObjectId(value, 'עובד');
  if (!id) return null;
  const employee = await EmployeeModel.findById(id).select('_id').lean();
  if (!employee?._id) {
    throw new Error('עובד לא נמצא');
  }
  return employee._id as Types.ObjectId;
}

async function resolveOptionalTractorObjectId(value: unknown): Promise<Types.ObjectId | null> {
  const id = parseOptionalObjectId(value, 'טרקטור');
  if (!id) return null;
  const tractor = await TractorModel.findById(id).select('_id').lean();
  if (!tractor?._id) {
    throw new Error('טרקטור לא נמצא');
  }
  return tractor._id as Types.ObjectId;
}

async function applyFuelTankSignedDelta(
  fuelTankId: Types.ObjectId,
  delta: number,
): Promise<void> {
  if (delta === 0) return;

  const fuelTank = await FuelTankModel.findById(fuelTankId)
    .select('_id currentAmount')
    .lean();
  if (!fuelTank) {
    throw new Error('מיכל דלק לא נמצא');
  }

  const nextAmount = roundQuantity(Number(fuelTank.currentAmount ?? 0) + delta);

  await FuelTankModel.findByIdAndUpdate(
    fuelTank._id,
    { $set: { currentAmount: nextAmount } },
    { runValidators: true },
  );
}

async function applyFuelTankAmount(
  fuelTankId: Types.ObjectId,
  amount: number,
  direction: FuelDirection,
): Promise<void> {
  await applyFuelTankSignedDelta(fuelTankId, signedFuelDelta(amount, direction));
}

async function revertFuelTankAfterDelete(existing: Record<string, unknown>): Promise<void> {
  const fuelTankId = toFuelTankObjectId(existing.fuelTank);
  const amount = Number(existing.amount ?? 0);
  const direction = await resolveDirectionFromExisting(existing);
  await applyFuelTankAmount(fuelTankId, amount, invertFuelDirection(direction));
}

async function syncFuelTankAfterUpdate(
  existing: Record<string, unknown>,
  patch: Partial<FuelOperationTrackingInput>,
  newDirection?: FuelDirection,
): Promise<void> {
  const oldTankId = toFuelTankObjectId(existing.fuelTank);
  const oldAmount = Number(existing.amount ?? 0);
  const oldDirection = await resolveDirectionFromExisting(existing);

  const newTankId = patch.fuelTank ?? oldTankId;
  const newAmount = patch.amount ?? oldAmount;
  const resolvedNewDirection = newDirection ?? oldDirection;

  if (
    String(oldTankId) === String(newTankId) &&
    oldDirection === resolvedNewDirection
  ) {
    if (patch.amount == null) return;
    const oldSigned = signedFuelDelta(oldAmount, oldDirection);
    const newSigned = signedFuelDelta(newAmount, resolvedNewDirection);
    await applyFuelTankSignedDelta(oldTankId, newSigned - oldSigned);
    return;
  }

  await applyFuelTankAmount(oldTankId, oldAmount, invertFuelDirection(oldDirection));
  await applyFuelTankAmount(newTankId, newAmount, resolvedNewDirection);
}

async function buildTrackingPatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Promise<{
  patch: Partial<FuelOperationTrackingInput>;
  fuelDirection?: FuelDirection;
}> {
  const { requireAll = false } = options;
  const patch: Partial<FuelOperationTrackingInput> = {};
  let fuelDirection: FuelDirection | undefined;
  const mustHave = (key: string) => requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('date')) {
    patch.date = parseDate(body.date);
  }
  if (mustHave('operation')) {
    const operation = await resolveFuelOperation(body.operation);
    patch.operation = operation.id;
    fuelDirection = operation.direction;
  }
  if (mustHave('fuelTank')) {
    patch.fuelTank = await resolveFuelTankObjectId(body.fuelTank);
  }
  if (mustHave('amount')) {
    patch.amount = parseAmount(body.amount);
  }
  if (mustHave('employee')) {
    patch.employee = await resolveOptionalEmployeeObjectId(body.employee);
  }
  if (mustHave('tractor')) {
    patch.tractor = await resolveOptionalTractorObjectId(body.tractor);
  }
  if (mustHave('notes')) {
    patch.notes = parseNotes(body.notes);
  }

  return { patch, fuelDirection };
}

export const fuelOperationTrackingService = {
  async list(seasonYear?: number): Promise<ApiDocument[]> {
    const rows = await fuelOperationTrackingRepository.findAll(seasonYear);
    return fuelOperationTrackingToApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const { patch, fuelDirection } = await buildTrackingPatch(body, { requireAll: true });
    if (
      patch.date == null ||
      patch.operation == null ||
      patch.fuelTank == null ||
      patch.amount == null ||
      fuelDirection == null
    ) {
      throw new Error('שדות חובה חסרים');
    }

    const input: FuelOperationTrackingInput = {
      date: patch.date,
      operation: patch.operation,
      fuelTank: patch.fuelTank,
      amount: patch.amount,
      employee: patch.employee ?? null,
      tractor: patch.tractor ?? null,
      notes: patch.notes ?? '',
    };

    const created = await fuelOperationTrackingRepository.create(input);
    try {
      await applyFuelTankAmount(input.fuelTank, input.amount, fuelDirection);
    } catch (error) {
      await fuelOperationTrackingRepository.delete(String(created._id));
      throw error;
    }

    const populated = await fuelOperationTrackingRepository.findById(String(created._id));
    return fuelOperationTrackingToApiDocument(
      (populated ?? created.toObject()) as Record<string, unknown>,
    );
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const existing = await fuelOperationTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    const { patch, fuelDirection } = await buildTrackingPatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    if (patch.amount != null || patch.fuelTank != null || patch.operation != null) {
      await syncFuelTankAfterUpdate(
        existing as Record<string, unknown>,
        patch,
        fuelDirection,
      );
    }

    const updated = await fuelOperationTrackingRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    return fuelOperationTrackingToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const existing = await fuelOperationTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }

    await revertFuelTankAfterDelete(existing as Record<string, unknown>);
    await fuelOperationTrackingRepository.delete(id);
  },

  async removeMany(ids: string[]): Promise<void> {
    const uniqueIds = [...new Set(ids.map((id) => String(id ?? '').trim()).filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const rows = await Promise.all(
      uniqueIds.map((rowId) => fuelOperationTrackingRepository.findById(rowId)),
    );
    if (rows.some((row) => row == null)) {
      throw new Error('לא נמצא');
    }

    for (const row of rows) {
      await revertFuelTankAfterDelete(row as Record<string, unknown>);
    }
    await fuelOperationTrackingRepository.deleteMany(uniqueIds);
  },
};
