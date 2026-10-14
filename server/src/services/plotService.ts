import mongoose, { Types } from 'mongoose';
import { CustomerModel } from '../models/Customer';
import { PLOT_TYPES, type PlotType } from '../models/Plot';
import { contractorTrackingRepository } from '../repositories/contractorTrackingRepository';
import { materialUsageTrackingRepository } from '../repositories/materialUsageTrackingRepository';
import { operationTrackingRepository } from '../repositories/operationTrackingRepository';
import { plotRepository, type PlotInput } from '../repositories/plotRepository';
import type { ApiDocument } from '../types/apiDocument';
import { dunamAmountsMatch } from '../utils/operationTrackingPricing';
import { plotToApiDocument, plotsToApiDocuments } from '../utils/plotApiMapper';

function parsePlotType(value: unknown): PlotType | null {
  if (value == null || value === '') return null;
  const str = String(value);
  if (str === '0') return null;
  if ((PLOT_TYPES as readonly string[]).includes(str)) {
    return str as PlotType;
  }
  throw new Error('סוג חלקה לא תקין');
}

function parseActive(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const str = String(value ?? '').trim();
  if (str === 'לא פעיל' || str === 'false' || str === '0') return false;
  return true;
}

async function resolveCustomerObjectId(customerId: string): Promise<Types.ObjectId> {
  if (!Types.ObjectId.isValid(customerId)) {
    throw new Error('לקוח לא נמצא');
  }
  const customer = await CustomerModel.findById(customerId).select('_id').lean();
  if (!customer?._id) {
    throw new Error('לקוח לא נמצא');
  }
  return customer._id as Types.ObjectId;
}

async function pickPlotFields(body: Record<string, unknown>): Promise<PlotInput> {
  const patch = await buildPlotPatch(body, { requireAll: true });
  return patch as PlotInput;
}

async function buildPlotPatch(
  body: Record<string, unknown>,
  options: { requireAll?: boolean } = {},
): Promise<Partial<PlotInput>> {
  const { requireAll = false } = options;
  const patch: Partial<PlotInput> = {};

  const mustHave = (key: string) => requireAll || Object.prototype.hasOwnProperty.call(body, key);

  if (mustHave('name')) {
    const name = String(body.name ?? '').trim();
    if (!name) {
      throw new Error('שם הוא שדה חובה');
    }
    patch.name = name;
  }

  if (mustHave('customer')) {
    const customerId = String(body.customer ?? '').trim();
    if (!customerId) {
      throw new Error('לקוח הוא שדה חובה');
    }
    patch.customer = await resolveCustomerObjectId(customerId);
  }

  if (mustHave('dunam')) {
    const dunam = Number(body.dunam);
    if (!Number.isFinite(dunam)) {
      throw new Error('דונם הוא שדה חובה');
    }
    patch.dunam = dunam;
  }

  if (mustHave('plotType')) {
    patch.plotType = parsePlotType(body.plotType);
  }

  if (mustHave('active')) {
    patch.active = parseActive(body.active);
  }

  return patch;
}

async function plotDunamWillChange(
  id: string,
  nextDunam: number | undefined,
): Promise<boolean> {
  if (nextDunam == null) return false;
  const existing = await plotRepository.findById(id);
  if (!existing) {
    throw new Error('לא נמצא');
  }
  return !dunamAmountsMatch(Number(existing.dunam), nextDunam);
}

export const plotService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await plotRepository.findAll();
    return plotsToApiDocuments(rows as Record<string, unknown>[]);
  },

  async listPaginated(listQuery: import('../utils/listQuery').ListQuery) {
    const result = await plotRepository.findPaginated(listQuery);
    return {
      ...result,
      items: plotsToApiDocuments(result.items as Record<string, unknown>[]),
    };
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = await pickPlotFields(body);
    const created = await plotRepository.create(fields);
    const populated = await plotRepository.findById(String(created._id));
    return plotToApiDocument((populated ?? created.toObject()) as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = await buildPlotPatch(body);
    if (Object.keys(fields).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }

    if (fields.dunam != null && fields.dunam < 0) {
      throw new Error('דונם לא יכול להיות שלילי');
    }

    const shouldCascade = await plotDunamWillChange(id, fields.dunam);
    if (!shouldCascade) {
      const updated = await plotRepository.update(id, fields);
      if (!updated) {
        throw new Error('לא נמצא');
      }
      return plotToApiDocument(updated as Record<string, unknown>);
    }

    const session = await mongoose.startSession();
    try {
      let updatedDoc: Record<string, unknown> | null = null;
      await session.withTransaction(async () => {
        const current = await plotRepository.findById(id, session);
        if (!current) {
          throw new Error('לא נמצא');
        }
        const previousDunam = Number(current.dunam);
        const updated = await plotRepository.update(id, fields, session);
        if (!updated) {
          throw new Error('לא נמצא');
        }
        if (fields.dunam != null && !dunamAmountsMatch(previousDunam, fields.dunam)) {
          await operationTrackingRepository.syncUnchargedAmountsForPlotDunam({
            plotId: id,
            previousDunam,
            nextDunam: fields.dunam,
            session,
          });
          await contractorTrackingRepository.syncUnchargedAmountsForPlotDunam({
            plotId: id,
            previousDunam,
            nextDunam: fields.dunam,
            session,
          });
          await materialUsageTrackingRepository.syncUnchargedAmountsForPlotDunam({
            plotId: id,
            previousDunam,
            nextDunam: fields.dunam,
            session,
          });
        }
        updatedDoc = updated as Record<string, unknown>;
      });
      if (!updatedDoc) {
        throw new Error('לא נמצא');
      }
      return plotToApiDocument(updatedDoc);
    } finally {
      await session.endSession();
    }
  },

  async remove(id: string): Promise<void> {
    const result = await plotRepository.delete(id);
    if (!result) {
      throw new Error('לא נמצא');
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await plotRepository.deleteMany(ids);
  },
};
