import { Types } from "mongoose";
import { OperationModel } from "../models/Operation";
import { OperationTrackingModel } from "../models/OperationTracking";
import type { ListQuery } from "../utils/listQuery";
import { listPaginatedDocuments } from "../utils/listPaginatedDocuments";
import { toObjectIds } from "../utils/mongoIds";
import {
  DUNAM_AMOUNT_MATCH_TOLERANCE,
  OPERATION_PRICING_BY_DUNAM,
} from "../utils/operationTrackingPricing";
import { buildSeasonDateQuery } from "../utils/seasonRange";

export type OperationTrackingInput = {
  date: Date;
  operation: Types.ObjectId;
  plot: Types.ObjectId | null;
  employee: Types.ObjectId;
  startTime: string;
  endTime: string;
  notes?: string;
  billable: boolean;
  wasCharged?: boolean;
  amount?: number | null;
  unitCost?: number | null;
};

const operationPopulate = {
  path: "operation",
  select: "_id name operationType currentCost pricingForm",
};
const plotPopulate = {
  path: "plot",
  select: "_id name customer dunam",
  populate: { path: "customer", select: "_id name" },
};
const employeePopulate = { path: "employee", select: "_id name" };

function resolvePopulatedCurrentCost(operation: unknown): number {
  if (operation && typeof operation === "object" && "currentCost" in operation) {
    const cost = Number(
      (operation as { currentCost?: unknown }).currentCost ?? 0,
    );
    if (Number.isFinite(cost) && cost >= 0) return cost;
  }
  return 0;
}

export const operationTrackingRepository = {
  findAll(seasonYear?: number) {
    const filter = seasonYear != null ? buildSeasonDateQuery(seasonYear) : {};
    return OperationTrackingModel.find(filter)
      .populate(operationPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .sort({ date: -1, employee: 1, startTime: -1 })
      .lean();
  },

  findPaginated(listQuery: ListQuery) {
    return listPaginatedDocuments(
      "operationsTrackings",
      OperationTrackingModel,
      listQuery,
      [operationPopulate, plotPopulate, employeePopulate],
    );
  },

  findById(id: string) {
    return OperationTrackingModel.findById(id)
      .populate(operationPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .lean();
  },

  create(data: OperationTrackingInput) {
    return OperationTrackingModel.create(data);
  },

  update(id: string, data: Partial<OperationTrackingInput>) {
    return OperationTrackingModel.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate(operationPopulate)
      .populate(plotPopulate)
      .populate(employeePopulate)
      .lean();
  },

  delete(id: string) {
    return OperationTrackingModel.findByIdAndDelete(id).lean();
  },

  deleteMany(ids: string[]) {
    return OperationTrackingModel.deleteMany({
      _id: { $in: toObjectIds(ids) },
    });
  },

  insertMany(rows: OperationTrackingInput[]) {
    return OperationTrackingModel.insertMany(rows);
  },

  deleteAll() {
    return OperationTrackingModel.deleteMany({});
  },

  async markCharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return null;

    const rows = await OperationTrackingModel.find({
      _id: { $in: ids },
      unitCost: null,
    })
      .select("_id operation")
      .populate({ path: "operation", select: "currentCost" })
      .lean();

    const idsByCost = new Map<number, Types.ObjectId[]>();
    for (const row of rows) {
      const cost = resolvePopulatedCurrentCost(row.operation);
      const group = idsByCost.get(cost) ?? [];
      group.push(row._id as Types.ObjectId);
      idsByCost.set(cost, group);
    }

    await Promise.all(
      [...idsByCost].map(([cost, rowIds]) =>
        OperationTrackingModel.updateMany(
          { _id: { $in: rowIds }, unitCost: null },
          { $set: { unitCost: cost, wasCharged: true } },
        ),
      ),
    );

    return OperationTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: true },
    );
  },

  markUncharged(ids: Types.ObjectId[]) {
    if (ids.length === 0) return Promise.resolve(null);
    return OperationTrackingModel.updateMany(
      { _id: { $in: ids } },
      { wasCharged: false },
    );
  },

  findByEmployeeAndDateRange(employeeId: string, start: Date, end: Date) {
    return OperationTrackingModel.find({
      employee: new Types.ObjectId(employeeId),
      date: { $gte: start, $lte: end },
    })
      .select("date startTime endTime employee")
      .sort({ date: 1 })
      .lean();
  },

  findDistinctEmployeeIdsInDateRange(start: Date, end: Date) {
    return OperationTrackingModel.distinct("employee", {
      date: { $gte: start, $lte: end },
    });
  },

  findByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return OperationTrackingModel.find({ _id: { $in: toObjectIds(ids) } })
      .select("date employee")
      .lean();
  },

  async syncUnchargedAmountsForPlotDunam(options: {
    plotId: string;
    previousDunam: number;
    nextDunam: number;
    session?: unknown;
  }): Promise<void> {
    if (!Types.ObjectId.isValid(options.plotId)) return;

    const operationQuery = OperationModel.find({
      $or: [
        { pricingForm: OPERATION_PRICING_BY_DUNAM },
        { pricingForm: null },
        { pricingForm: { $exists: false } },
      ],
    }).select("_id");
    if (options.session) operationQuery.session(options.session as never);
    const operations = await operationQuery.lean();
    const operationIds = operations.map((operation) => operation._id);
    if (operationIds.length === 0) return;

    await OperationTrackingModel.updateMany(
      {
        plot: new Types.ObjectId(options.plotId),
        wasCharged: { $ne: true },
        operation: { $in: operationIds },
        $expr: {
          $and: [
            { $isNumber: "$amount" },
            {
              $lte: [
                { $abs: { $subtract: ["$amount", options.previousDunam] } },
                DUNAM_AMOUNT_MATCH_TOLERANCE,
              ],
            },
          ],
        },
      },
      { $set: { amount: options.nextDunam } },
      options.session ? { session: options.session as never } : undefined,
    );
  },

  async syncUnchargedUnitCostsForOperationCost(options: {
    operationId: string;
    previousCost: number;
    nextCost: number;
    session?: unknown;
  }): Promise<void> {
    if (!Types.ObjectId.isValid(options.operationId)) return;

    await OperationTrackingModel.updateMany(
      {
        operation: new Types.ObjectId(options.operationId),
        billable: true,
        wasCharged: { $ne: true },
        $expr: {
          $and: [
            { $isNumber: "$unitCost" },
            {
              $lte: [
                { $abs: { $subtract: ["$unitCost", options.previousCost] } },
                DUNAM_AMOUNT_MATCH_TOLERANCE,
              ],
            },
          ],
        },
      },
      { $set: { unitCost: options.nextCost } },
      options.session ? { session: options.session as never } : undefined,
    );
  },
};
