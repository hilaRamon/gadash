import { createDocument, deleteDocument, listCollection, updateDocument } from "@/api/collectionApi";
import { plotsSeedData } from "@/data/plotsSeed";
import { isDateInSeason } from "./seasonRange";
import { DEFAULT_TRANSPORT_BILLING } from "./transportBilling";
import type {
  GlobalTransportChargeDetail,
  GlobalTransportChargePreview,
  GlobalTransportChargeResult,
} from "@/api/transportGlobalChargeApi";
import { GLOBAL_TRANSPORT_CHARGE_ALREADY_BILLED_ERROR } from "./customerBillingErrors";
import type { CollectionDocument } from "@/schema/types";

const GLOBAL_TRANSPORT_CHARGE_OPERATIONS = ["זריעה", "זריעה+אי פליחה"];

type PlotRow = {
  _id: string;
  name: string;
  customer: string;
  customerName: string;
  dunam: number;
};

const globalChargeStore: CollectionDocument[] = [];

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function roundPricePerDunam(value: number): number {
  return Number(value.toFixed(3));
}

function toIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "")).filter(Boolean);
}

async function findSeasonPlotsForGlobalCharge(
  seasonYear: number,
): Promise<PlotRow[]> {
  const [trackings, plots, customers] = await Promise.all([
    listCollection("operationsTrackings", { season: seasonYear }),
    listCollection("plots"),
    listCollection("customers"),
  ]);

  const dunamByPlotId = new Map<string, number>();
  for (const row of trackings) {
    if (
      !GLOBAL_TRANSPORT_CHARGE_OPERATIONS.includes(
        String(row.operationName ?? ""),
      )
    ) {
      continue;
    }
    const plotId = String(row.plot ?? "").trim();
    if (!plotId) continue;
    const amount = Number(row.amount ?? 0);
    if (!Number.isFinite(amount)) continue;
    dunamByPlotId.set(plotId, (dunamByPlotId.get(plotId) ?? 0) + amount);
  }

  const customerNameById = new Map(
    customers.map((row) => [String(row._id), String(row.name ?? "")]),
  );
  const plotById = new Map(
    [...plots, ...plotsSeedData].map((plot) => [String(plot._id), plot]),
  );

  const result: PlotRow[] = [];
  for (const [plotId, dunam] of dunamByPlotId) {
    if (dunam <= 0) continue;
    const plot = plotById.get(plotId);
    if (!plot) continue;
    const customerId = String(plot.customer ?? "");
    result.push({
      _id: plotId,
      name: String(plot.name ?? ""),
      customer: customerId,
      customerName: customerNameById.get(customerId) ?? "",
      dunam,
    });
  }

  return result;
}

async function computeChargeData(seasonYear: number) {
  const transports = await listCollection("transportTrackings", {
    season: seasonYear,
  });
  const transportRows = transports.filter(
    (row) =>
      row.wasCharged !== true &&
      String(row.billing ?? DEFAULT_TRANSPORT_BILLING) === DEFAULT_TRANSPORT_BILLING &&
      isDateInSeason(row.date, seasonYear),
  );

  const transportTotal = roundMoney(
    transportRows.reduce((sum, row) => sum + Number(row.finalPrice ?? 0), 0),
  );
  if (transportTotal <= 0) {
    throw new Error("אין הובלות גלובליות לחיוב בעונה");
  }

  const plots = await findSeasonPlotsForGlobalCharge(seasonYear);
  const totalDunam = plots.reduce((sum, plot) => sum + plot.dunam, 0);
  if (totalDunam <= 0) {
    throw new Error("אין דונמים לחלוקה");
  }

  const pricePerDunam = roundPricePerDunam(transportTotal / totalDunam);
  const sortedPlots = [...plots].sort((a, b) => a._id.localeCompare(b._id));
  const plotLinePrices = new Map<string, number>();
  let allocated = 0;

  sortedPlots.forEach((plot, index) => {
    const isLast = index === sortedPlots.length - 1;
    const linePrice = isLast
      ? roundMoney(transportTotal - allocated)
      : roundMoney(pricePerDunam * plot.dunam);
    plotLinePrices.set(plot._id, linePrice);
    allocated += linePrice;
  });

  const groups = new Map<string, { customerName: string; plots: PlotRow[] }>();
  for (const plot of plots) {
    const existing = groups.get(plot.customer);
    if (existing) {
      existing.plots.push(plot);
    } else {
      groups.set(plot.customer, {
        customerName: plot.customerName,
        plots: [plot],
      });
    }
  }

  return {
    transportRows,
    transportTotal,
    totalDunam,
    pricePerDunam,
    plotLinePrices,
    customerGroups: [...groups.entries()].map(([customerId, group]) => ({
      customerId,
      ...group,
    })),
    plotCount: plots.length,
  };
}

function batchToListRow(
  batch: CollectionDocument,
  chargedCount: number,
): CollectionDocument {
  const transportTrackingIds = toIdArray(batch.transportTrackingIds);
  return {
    ...batch,
    transportRowCount: transportTrackingIds.length,
    billsCount: chargedCount,
  };
}

async function allocationsForCharge(chargeId: string) {
  const allocations = await listCollection("transportGlobalAllocations");
  return allocations.filter(
    (row) => String(row.globalTransportChargeId ?? "") === chargeId,
  );
}

export async function listTransportGlobalChargesMock(
  seasonYear?: number,
): Promise<CollectionDocument[]> {
  const allocations = await listCollection("transportGlobalAllocations");
  const chargedCountByCharge = new Map<string, number>();
  for (const row of allocations) {
    if (row.wasCharged !== true) continue;
    const chargeId = String(row.globalTransportChargeId ?? "");
    chargedCountByCharge.set(
      chargeId,
      (chargedCountByCharge.get(chargeId) ?? 0) + 1,
    );
  }

  const rows = globalChargeStore.map((batch) =>
    batchToListRow(batch, chargedCountByCharge.get(String(batch._id)) ?? 0),
  );
  if (seasonYear == null) return rows;
  return rows.filter((row) => Number(row.seasonYear) === seasonYear);
}

export async function fetchTransportGlobalChargeDetailMock(
  id: string,
): Promise<GlobalTransportChargeDetail> {
  const batch = globalChargeStore.find((row) => row._id === id);
  if (!batch) {
    throw new Error("לא נמצא");
  }

  const [allocations, customers] = await Promise.all([
    allocationsForCharge(id),
    listCollection("customers"),
  ]);
  const customerNameById = new Map(
    customers.map((row) => [String(row._id), String(row.name ?? "")]),
  );
  const pricePerDunam = Number(batch.pricePerDunam ?? 0);
  const chargedCount = allocations.filter((row) => row.wasCharged === true).length;
  const listRow = batchToListRow(batch, chargedCount);

  return {
    _id: String(batch._id),
    seasonYear: Number(batch.seasonYear ?? 0),
    executedAt: String(batch.executedAt ?? ""),
    transportTotal: Number(batch.transportTotal ?? 0),
    totalDunam: Number(batch.totalDunam ?? 0),
    pricePerDunam,
    transportRowCount: Number(listRow.transportRowCount ?? 0),
    billsCount: chargedCount,
    allocations: allocations.map((row) => {
      const customerId = String(row.customer ?? "");
      return {
        _id: String(row._id),
        customer: customerId,
        customerName:
          String(row.customerName ?? "") ||
          customerNameById.get(customerId) ||
          "",
        dunam: Number(row.dunam ?? 0),
        pricePerDunam,
        finalPrice: Number(row.finalPrice ?? 0),
        wasCharged: row.wasCharged === true,
      };
    }),
  };
}

export async function cancelTransportGlobalChargeMock(id: string): Promise<void> {
  const index = globalChargeStore.findIndex((row) => row._id === id);
  if (index === -1) {
    throw new Error("לא נמצא");
  }

  const batch = globalChargeStore[index];
  const allocations = await allocationsForCharge(id);
  if (allocations.some((row) => row.wasCharged === true)) {
    throw new Error(GLOBAL_TRANSPORT_CHARGE_ALREADY_BILLED_ERROR);
  }

  const transportIds = toIdArray(batch.transportTrackingIds);
  for (const transportId of transportIds) {
    await updateDocument("transportTrackings", transportId, {
      wasCharged: false,
    });
  }

  for (const allocation of allocations) {
    await deleteDocument("transportGlobalAllocations", allocation._id);
  }

  globalChargeStore.splice(index, 1);
}

export async function previewGlobalTransportChargeMock(
  seasonYear: number,
): Promise<GlobalTransportChargePreview> {
  const data = await computeChargeData(seasonYear);
  const customers = [...data.customerGroups]
    .sort((a, b) => a.customerName.localeCompare(b.customerName, "he"))
    .map((group) => ({
      customerName: group.customerName,
      dunam: group.plots.reduce((sum, plot) => sum + plot.dunam, 0),
      price: roundMoney(
        group.plots.reduce(
          (sum, plot) => sum + (data.plotLinePrices.get(plot._id) ?? 0),
          0,
        ),
      ),
    }));

  return {
    seasonYear,
    transportTotal: data.transportTotal,
    transportRowCount: data.transportRows.length,
    totalDunam: data.totalDunam,
    pricePerDunam: data.pricePerDunam,
    plotCount: data.plotCount,
    customerCount: data.customerGroups.length,
    customers,
  };
}

export async function executeGlobalTransportChargeMock(
  seasonYear: number,
): Promise<GlobalTransportChargeResult> {
  const preview = await previewGlobalTransportChargeMock(seasonYear);
  const data = await computeChargeData(seasonYear);
  const executedAt = new Date();
  const transportTrackingIds = data.transportRows.map((row) => String(row._id));

  const batchId = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  globalChargeStore.push({
    _id: batchId,
    seasonYear,
    executedAt: executedAt.toISOString().slice(0, 10),
    transportTotal: data.transportTotal,
    totalDunam: data.totalDunam,
    pricePerDunam: data.pricePerDunam,
    transportTrackingIds,
    customerBillingIds: [],
  });

  for (const group of data.customerGroups) {
    await createDocument("transportGlobalAllocations", {
      globalTransportChargeId: batchId,
      customer: group.customerId,
      customerName: group.customerName,
      dunam: group.plots.reduce((sum, plot) => sum + plot.dunam, 0),
      finalPrice: roundMoney(
        group.plots.reduce(
          (sum, plot) => sum + (data.plotLinePrices.get(plot._id) ?? 0),
          0,
        ),
      ),
      wasCharged: false,
    });
  }

  for (const row of data.transportRows) {
    await updateDocument("transportTrackings", String(row._id), {
      wasCharged: true,
    });
  }

  return {
    ...preview,
    globalChargeId: batchId,
    allocationsCreated: data.customerGroups.length,
  };
}
