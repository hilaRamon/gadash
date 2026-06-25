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
  return num;
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

async function applyFuelTankAmount(
  fuelTankId: Types.ObjectId,
  amount: number,
  direction: FuelDirection,
): Promise<void> {
  const fuelTank = await FuelTankModel.findById(fuelTankId)
    .select('_id currentAmount')
    .lean();
  if (!fuelTank) {
    throw new Error('מיכל דלק לא נמצא');
  }
  const currentAmount = Number(fuelTank.currentAmount ?? 0);
  const delta = direction === 'decrement' ? -amount : amount;
  const nextAmount = Number((currentAmount + delta).toFixed(3));
  if (nextAmount < 0) {
    throw new Error('אין מספיק דלק במיכל');
  }
  await FuelTankModel.findByIdAndUpdate(
    fuelTank._id,
    { $set: { currentAmount: nextAmount } },
    { runValidators: true },
  );
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
    const { patch } = await buildTrackingPatch(body);
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }
    const updated = await fuelOperationTrackingRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    return fuelOperationTrackingToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const result = await fuelOperationTrackingRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await fuelOperationTrackingRepository.deleteMany(ids);
  },
};
