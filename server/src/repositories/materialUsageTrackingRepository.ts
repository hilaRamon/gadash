import { Types } from 'mongoose';
import { MaterialModel } from '../models/Material';
import { MaterialUsageTrackingModel } from '../models/MaterialUsageTracking';
import type { ListQuery } from '../utils/listQuery';
import { listPaginatedDocuments } from '../utils/listPaginatedDocuments';
import { toObjectIds } from '../utils/mongoIds';
import { calcMaterialUsageAmount } from '../utils/materialUsageAmount';
import { dunamAmountsMatch } from '../utils/operationTrackingPricing';
import { roundQuantity } from '../utils/quantityPrecision';
import { buildSeasonDateQuery } from '../utils/seasonRange';

export type MaterialUsageTrackingInput = {
  date: Date;
  material: Types.ObjectId;
  plot: Types.ObjectId;
  employee: Types.ObjectId;
  amount: number;
  unitPrice?: number | null;
  notes?: string;
  billable: boolean;
  wasCharged?: boolean;
};

const materialPopulate = {
  path: 'material',
  select: '_id name currentBuyingCost currentSalePercent pricingHistory',
};
const plotPopulate = {
  path: 'plot',
  select: '_id name customer',
  populate: { path: 'customer', select: '_id name' },
};
const employeePopulate = { path: 'employee', select: '_id name' };

export const materialUsageTrackingRepository = {
  findAll(seasonYear?: number) {
    const filter = seasonYear != null ? buildSeasonDateQuery(seasonYear) : {};
    return MaterialUsageTrackingModel.find(filter)
      .populate(materialPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .sort({ date: -1 })
      .lean();
  },

  findPaginated(listQuery: ListQuery) {
    return listPaginatedDocuments(
      'materialUsageTrackings',
      MaterialUsageTrackingModel,
      listQuery,
      [materialPopulate, plotPopulate, employeePopulate],
    );
  },

  findById(id: string) {
    return MaterialUsageTrackingModel.findById(id)
      .populate(materialPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .lean();
  },

  create(data: MaterialUsageTrackingInput) {
    return MaterialUsageTrackingModel.create(data);
  },

  update(id: string, data: Partial<MaterialUsageTrackingInput>) {
    return MaterialUsageTrackingModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate(materialPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .lean();
  },

  delete(id: string) {
    return MaterialUsageTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return MaterialUsageTrackingModel.deleteMany({ _id: { $in: toObjectIds(ids) } });
  },

  insertMany(rows: MaterialUsageTrackingInput[]) {
    return MaterialUsageTrackingModel.insertMany(rows);
  },

  deleteAll() {
    return MaterialUsageTrackingModel.deleteMany({});
  },

  markCharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return MaterialUsageTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: true },
    );
  },

  markUncharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return MaterialUsageTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: false },
    );
  },

  async syncUnchargedAmountsForPlotDunam(options: {
    plotId: string;
    previousDunam: number;
    nextDunam: number;
    session?: unknown;
  }): Promise<void> {
    if (!Types.ObjectId.isValid(options.plotId)) return;

    const usageQuery = MaterialUsageTrackingModel.find({
      plot: new Types.ObjectId(options.plotId),
      wasCharged: { $ne: true },
    }).select('_id material amount');
    if (options.session) usageQuery.session(options.session as never);
    const rows = await usageQuery.lean();
    if (rows.length === 0) return;

    const materialIds = [
      ...new Set(rows.map((row) => String(row.material))),
    ].map((id) => new Types.ObjectId(id));
    const materialQuery = MaterialModel.find({ _id: { $in: materialIds } }).select(
      '_id amountPerDunam currentQuantity',
    );
    if (options.session) materialQuery.session(options.session as never);
    const materials = await materialQuery.lean();
    const materialById = new Map(materials.map((material) => [String(material._id), material]));

    const stockDeltaByMaterialId = new Map<string, number>();

    for (const row of rows) {
      const material = materialById.get(String(row.material));
      if (!material) continue;
      const previousAmount = calcMaterialUsageAmount(
        options.previousDunam,
        material.amountPerDunam,
      );
      const nextAmount = calcMaterialUsageAmount(
        options.nextDunam,
        material.amountPerDunam,
      );
      if (previousAmount == null || nextAmount == null) continue;
      if (!dunamAmountsMatch(Number(row.amount), previousAmount)) continue;
      if (dunamAmountsMatch(previousAmount, nextAmount)) continue;

      const updated = await MaterialUsageTrackingModel.updateOne(
        { _id: row._id, wasCharged: { $ne: true } },
        { $set: { amount: nextAmount } },
        options.session ? { session: options.session as never } : undefined,
      );
      if (updated.modifiedCount === 0) continue;

      const materialId = String(material._id);
      const delta = roundQuantity(previousAmount - nextAmount);
      stockDeltaByMaterialId.set(
        materialId,
        roundQuantity((stockDeltaByMaterialId.get(materialId) ?? 0) + delta),
      );
    }

    for (const [materialId, delta] of stockDeltaByMaterialId) {
      if (delta === 0) continue;
      const material = materialById.get(materialId);
      if (!material) {
        throw new Error('חומר לא נמצא');
      }
      const nextQuantity = roundQuantity(Number(material.currentQuantity ?? 0) + delta);
      await MaterialModel.findByIdAndUpdate(
        material._id,
        { $set: { currentQuantity: nextQuantity } },
        {
          runValidators: true,
          ...(options.session ? { session: options.session as never } : {}),
        },
      );
    }
  },
};
