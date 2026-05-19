import { Types } from 'mongoose';
import { CustomerModel } from '../models/Customer';
import { PLOT_TYPES, type PlotType } from '../models/Plot';
import { plotRepository, type PlotInput } from '../repositories/plotRepository';
import type { ApiDocument } from '../types/apiDocument';
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

async function pickPlotFields(
  body: Record<string, unknown>,
): Promise<Omit<PlotInput, 'plotNumber'>> {
  const patch = await buildPlotPatch(body, { requireAll: true });
  return patch as Omit<PlotInput, 'plotNumber'>;
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

  if (mustHave('plotNumber')) {
    const plotNumber = Number(body.plotNumber);
    if (!Number.isFinite(plotNumber)) {
      throw new Error('מספר חלקה הוא שדה חובה');
    }
    patch.plotNumber = plotNumber;
  }

  return patch;
}

export const plotService = {
  async list(): Promise<ApiDocument[]> {
    const rows = await plotRepository.findAll();
    return plotsToApiDocuments(rows as Record<string, unknown>[]);
  },

  async create(body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = await pickPlotFields(body);
    const plotNumber = Number(body.plotNumber);
    if (!Number.isFinite(plotNumber)) {
      throw new Error('מספר חלקה הוא שדה חובה');
    }

    const doc: PlotInput = {
      plotNumber,
      ...fields,
    };

    const created = await plotRepository.create(doc);
    const populated = await plotRepository.findById(String(created._id));
    return plotToApiDocument((populated ?? created.toObject()) as Record<string, unknown>);
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiDocument> {
    const fields = await buildPlotPatch(body);
    if (Object.keys(fields).length === 0) {
      throw new Error('לא נמצאו שדות לעדכון');
    }
    const updated = await plotRepository.update(id, fields);
    if (!updated) {
      throw new Error('לא נמצא');
    }

    return plotToApiDocument(updated as Record<string, unknown>);
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
