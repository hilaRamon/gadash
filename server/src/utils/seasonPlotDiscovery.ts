import { Types } from "mongoose";
import { GLOBAL_TRANSPORT_CHARGE_OPERATIONS } from "../lib/globalTransportChargeConfig";
import { ContractorTrackingModel } from "../models/ContractorTracking";
import { MaterialUsageTrackingModel } from "../models/MaterialUsageTracking";
import { OperationModel } from "../models/Operation";
import { OperationTrackingModel } from "../models/OperationTracking";
import { PlotModel } from "../models/Plot";
import { isFuelOperationType } from "./unbilledTrackingFilters";
import { buildSeasonDateQuery } from "./seasonRange";

export type SeasonPlotRow = {
  _id: Types.ObjectId;
  name: string;
  customer: Types.ObjectId;
  customerName: string;
  dunam: number;
};

async function loadSeasonPlotRows(
  plotIdSet: Set<string>,
  dunamByPlotId?: Map<string, number>,
): Promise<SeasonPlotRow[]> {
  if (plotIdSet.size === 0) return [];

  const plots = await PlotModel.find({
    _id: { $in: [...plotIdSet].map((id) => new Types.ObjectId(id)) },
  })
    .populate({ path: "customer", select: "_id name" })
    .lean();

  return plots.map((plot) => {
    const customer = plot.customer as { _id?: unknown; name?: string } | null;
    const plotId = String(plot._id);
    return {
      _id: plot._id as Types.ObjectId,
      name: String(plot.name ?? ""),
      customer: (customer?._id ?? plot.customer) as Types.ObjectId,
      customerName: String(customer?.name ?? ""),
      dunam:
        dunamByPlotId != null
          ? Number(dunamByPlotId.get(plotId) ?? 0)
          : Number(plot.dunam ?? 0),
    };
  });
}

async function distinctPlotIdsFromSeasonOperations(
  seasonYear: number,
): Promise<Types.ObjectId[]> {
  const seasonFilter = buildSeasonDateQuery(seasonYear);
  const rows = await OperationTrackingModel.find({
    ...seasonFilter,
    plot: { $exists: true, $ne: null },
  })
    .select("plot operation")
    .populate({ path: "operation", select: "operationType" })
    .lean();

  const plotIds = new Set<string>();
  for (const row of rows) {
    const operation = row.operation as { operationType?: unknown } | null;
    if (isFuelOperationType(operation?.operationType)) continue;
    if (row.plot) plotIds.add(String(row.plot));
  }
  return [...plotIds].map((id) => new Types.ObjectId(id));
}

export async function findSeasonPlotsWithWork(
  seasonYear: number,
): Promise<SeasonPlotRow[]> {
  const seasonFilter = buildSeasonDateQuery(seasonYear);

  const [operationPlotIds, materialPlotIds, contractorPlotIds] =
    await Promise.all([
      distinctPlotIdsFromSeasonOperations(seasonYear),
      MaterialUsageTrackingModel.distinct("plot", {
        ...seasonFilter,
        plot: { $exists: true, $ne: null },
      }),
      ContractorTrackingModel.distinct("plot", {
        ...seasonFilter,
        plot: { $exists: true, $ne: null },
      }),
    ]);

  const plotIdSet = new Set<string>();
  for (const id of [
    ...operationPlotIds,
    ...materialPlotIds,
    ...contractorPlotIds,
  ]) {
    if (id) plotIdSet.add(String(id));
  }

  return loadSeasonPlotRows(plotIdSet);
}

export async function findSeasonPlotsForGlobalCharge(
  seasonYear: number,
): Promise<SeasonPlotRow[]> {
  const operations = await OperationModel.find({
    name: { $in: GLOBAL_TRANSPORT_CHARGE_OPERATIONS },
  })
    .select("_id")
    .lean();

  if (operations.length === 0) return [];

  const grouped = await OperationTrackingModel.aggregate<{
    _id: Types.ObjectId;
    dunam: number;
  }>([
    {
      $match: {
        ...buildSeasonDateQuery(seasonYear),
        plot: { $exists: true, $ne: null },
        operation: { $in: operations.map((row) => row._id) },
      },
    },
    {
      $group: {
        _id: "$plot",
        dunam: { $sum: { $ifNull: ["$amount", 0] } },
      },
    },
    { $match: { dunam: { $gt: 0 } } },
  ]);

  const dunamByPlotId = new Map(
    grouped.map((row) => [String(row._id), Number(row.dunam)]),
  );

  return loadSeasonPlotRows(new Set(dunamByPlotId.keys()), dunamByPlotId);
}
