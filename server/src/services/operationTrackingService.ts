import { Types } from 'mongoose';
import { EmployeeModel } from '../models/Employee';
import { OperationModel } from '../models/Operation';
import { PlotModel } from '../models/Plot';
import {
  operationTrackingRepository,
  type OperationTrackingInput,
} from '../repositories/operationTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import { assertTrackingNotCharged } from '../utils/assertTrackingNotCharged';
import {
  operationTrackingToApiDocument,
  operationTrackingToApiDocuments,
} from '../utils/operationTrackingApiMapper';
import { monthlyReportService } from './monthlyReportService';

function parseAdminOverride(body: Record<string, unknown>): boolean {
  const value = body.adminOverride;
  if (value === true || value === 'true') return true;
  return false;
}

function stripAdminOverride(body: Record<string, unknown>): Record<string, unknown> {
  const { adminOverride: _adminOverride, ...rest } = body;
  return rest;
}

function parseDate(value: unknown): Date {
  if (value == null || value === '') return new Date();
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('תאריך לא תקין');
  }
  return date;
}

function parseTime(value: unknown, label: string): string {
  const raw = String(value ?? '').trim();
  if (!/^([01]?\d|2[0-3]):([0-5]\d)$/.test(raw)) {
    throw new Error(`${label} לא תקינה`);
  }
  return raw.padStart(5, '0');
}

function assertTimeRange(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  if (end <= start) {
    throw new Error('שעת סיום חייבת להיות אחרי שעת התחלה');
  }
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

function parseDunam(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('דונם לא תקין');
  }
  return num;
}

function parseUnitCost(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('מחיר לדונם לא תקין');
  }
  return num;
}

async function resolvePlotDunam(plotId: Types.ObjectId | null): Promise<number | null> {
  if (!plotId) return null;
  const plot = await PlotModel.findById(plotId).select('dunam').lean();
  if (!plot) return null;
  return Number(plot.dunam ?? 0);
}

async function resolveOperationUnitCost(
  operationId: Types.ObjectId,
): Promise<number | null> {
  const operation = await OperationModel.findById(operationId).select('currentCost').lean();
  if (!operation) return null;
  return Number(operation.currentCost ?? 0);
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

async function resolvePlotObjectId(plotId: unknown): Promise<Types.ObjectId | null> {
  if (plotId == null || plotId === '') {
    return null;
  }
  const id = String(plotId).trim();
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

async function buildTrackingPatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Promise<Partial<OperationTrackingInput>> {
  const { requireAll = false } = options;
  const patch: Partial<OperationTrackingInput> = {};
  const mustHave = (key: string) => requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('date')) {
    patch.date = parseDate(body.date);
  }
  if (mustHave('operation')) {
    patch.operation = await resolveOperationObjectId(body.operation);
  }
  if (mustHave('plot')) {
    patch.plot = await resolvePlotObjectId(body.plot);
  }
  if (mustHave('employee')) {
    patch.employee = await resolveEmployeeObjectId(body.employee);
  }
  if (mustHave('startTime')) {
    patch.startTime = parseTime(body.startTime, 'שעת התחלה');
  }
  if (mustHave('endTime')) {
    patch.endTime = parseTime(body.endTime, 'שעת סיום');
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
  if (Object.prototype.hasOwnProperty.call(body, 'dunam')) {
    patch.dunam =
      body.dunam == null || body.dunam === '' ? null : parseDunam(body.dunam);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'unitCost')) {
    patch.unitCost =
      body.unitCost == null || body.unitCost === ''
        ? null
        : parseUnitCost(body.unitCost);
  }

  const startTime = patch.startTime;
  const endTime = patch.endTime;
  if (startTime && endTime) {
    assertTimeRange(startTime, endTime);
  }

  return patch;
}

export const operationTrackingService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await operationTrackingRepository.findAll();
    return operationTrackingToApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const adminOverride = parseAdminOverride(body);
    const patch = await buildTrackingPatch(stripAdminOverride(body), { requireAll: true });
    if (
      patch.date == null ||
      patch.operation == null ||
      patch.employee == null ||
      patch.startTime == null ||
      patch.endTime == null
    ) {
      throw new Error('שדות חובה חסרים');
    }

    assertTimeRange(patch.startTime, patch.endTime);

    await monthlyReportService.assertMonthNotLocked(
      String(patch.employee),
      patch.date,
      adminOverride,
    );

    const input: OperationTrackingInput = {
      date: patch.date,
      operation: patch.operation,
      plot: patch.plot ?? null,
      employee: patch.employee,
      startTime: patch.startTime,
      endTime: patch.endTime,
      notes: patch.notes ?? '',
      billable: patch.billable ?? true,
      wasCharged: patch.wasCharged ?? false,
      dunam:
        patch.dunam !== undefined
          ? patch.dunam
          : await resolvePlotDunam(patch.plot ?? null),
      unitCost:
        patch.unitCost !== undefined
          ? patch.unitCost
          : await resolveOperationUnitCost(patch.operation),
    };

    const created = await operationTrackingRepository.create(input);
    await monthlyReportService.ensureOpenReport(String(patch.employee), patch.date);
    const populated = await operationTrackingRepository.findById(String(created._id));
    return operationTrackingToApiDocument(
      (populated ?? created.toObject()) as Record<string, unknown>,
    );
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const adminOverride = parseAdminOverride(body);
    const patch = await buildTrackingPatch(stripAdminOverride(body));
    if (Object.keys(patch).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    if (patch.startTime || patch.endTime) {
      const existing = await operationTrackingRepository.findById(id);
      if (!existing) {
        throw new Error('לא נמצא');
      }
      const startTime = patch.startTime ?? String(existing.startTime ?? '');
      const endTime = patch.endTime ?? String(existing.endTime ?? '');
      assertTimeRange(startTime, endTime);
    }

    const existing = await operationTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }
    assertTrackingNotCharged(existing as { wasCharged?: boolean });

    const nextEmployeeId = patch.employee
      ? String(patch.employee)
      : String(existing.employee?._id ?? existing.employee);
    const nextDate = patch.date ?? new Date(existing.date as Date);
    const previousEmployeeId = String(existing.employee?._id ?? existing.employee);
    const previousDate = new Date(existing.date as Date);

    await monthlyReportService.assertMonthNotLocked(
      previousEmployeeId,
      previousDate,
      adminOverride,
    );
    if (nextEmployeeId !== previousEmployeeId || nextDate.getTime() !== previousDate.getTime()) {
      await monthlyReportService.assertMonthNotLocked(nextEmployeeId, nextDate, adminOverride);
    }

    const updated = await operationTrackingRepository.update(id, patch);
    if (!updated) {
      throw new Error('לא נמצא');
    }
    await monthlyReportService.ensureOpenReport(nextEmployeeId, nextDate);
    return operationTrackingToApiDocument(updated as Record<string, unknown>);
  },

  async remove(id: string, adminOverride = false): Promise<void> {
    const existing = await operationTrackingRepository.findById(id);
    if (!existing) {
      throw new Error('לא נמצא');
    }
    await monthlyReportService.assertMonthNotLocked(
      String(existing.employee?._id ?? existing.employee),
      new Date(existing.date as Date),
      adminOverride,
    );
    const result = await operationTrackingRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[], adminOverride = false): Promise<void> {
    const rows = await operationTrackingRepository.findByIds(ids);
    for (const row of rows) {
      await monthlyReportService.assertMonthNotLocked(
        String(row.employee),
        new Date(row.date as Date),
        adminOverride,
      );
    }
    await operationTrackingRepository.deleteMany(ids);
  },
};
