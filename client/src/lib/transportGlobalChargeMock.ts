import { createDocument, deleteCustomerBillingForGlobalChargeCancelMock, listCollection, updateDocument } from "./collectionApi";
import { buildGlobalTransportBillDocument } from "./customerBill/buildCustomerBillData";
import { plotsSeedData } from "../data/plotsSeed";
import { isDateInSeason } from "./seasonRange";
import { DEFAULT_TRANSPORT_BILLING } from "./transportBilling";
import type {
  GlobalTransportChargeDetail,
  GlobalTransportChargePreview,
  GlobalTransportChargeResult,
} from "./transportGlobalChargeApi";
import { PAID_BILLING_DELETE_ERROR } from "./customerBillingErrors";
import { isFuelOperation } from "./unbilledTrackingFilters";
import type { CollectionDocument } from "../schema/types";

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

async function findSeasonPlotsWithWork(seasonYear: number): Promise<PlotRow[]> {
  const [operations, materials, contractors, plots, customers] = await Promise.all([
    listCollection("operationsTrackings", { season: seasonYear }),
    listCollection("materialUsageTrackings", { season: seasonYear }),
    listCollection("contractorTrackings", { season: seasonYear }),
    listCollection("plots"),
    listCollection("customers"),
  ]);

  const customerNameById = new Map(
    customers.map((row) => [String(row._id), String(row.name ?? "")]),
  );

  const plotIdSet = new Set<string>();
  for (const row of operations) {
    if (isFuelOperation(row)) continue;
    if (row.plot) plotIdSet.add(String(row.plot));
  }
  for (const row of materials) {
    if (row.plot) plotIdSet.add(String(row.plot));
  }
  for (const row of contractors) {
    if (row.plot) plotIdSet.add(String(row.plot));
  }

  const plotById = new Map(
    [...plots, ...plotsSeedData].map((plot) => [String(plot._id), plot]),
  );

  const result: PlotRow[] = [];
  for (const plotId of plotIdSet) {
    const plot = plotById.get(plotId);
    if (!plot) continue;
    const customerId = String(plot.customer ?? "");
    result.push({
      _id: plotId,
      name: String(plot.name ?? ""),
      customer: customerId,
      customerName: customerNameById.get(customerId) ?? "",
      dunam: Number(plot.dunam ?? 0),
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

  const plots = await findSeasonPlotsWithWork(seasonYear);
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

function batchToListRow(batch: CollectionDocument): CollectionDocument {
  const transportTrackingIds = toIdArray(batch.transportTrackingIds);
  const customerBillingIds = toIdArray(batch.customerBillingIds);
  return {
    ...batch,
    transportRowCount: transportTrackingIds.length,
    billsCount: customerBillingIds.length,
  };
}

export async function listTransportGlobalChargesMock(
  seasonYear?: number,
): Promise<CollectionDocument[]> {
  const rows = globalChargeStore.map(batchToListRow);
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

  const billingIds = toIdArray(batch.customerBillingIds);
  const billings = await listCollection("customerBillingTrackings");
  const customerBillings = billingIds
    .map((billingId) => billings.find((row) => row._id === billingId))
    .filter((row): row is CollectionDocument => row != null)
    .map((billing) => ({
      ...billing,
      customerName: String(billing.customerName ?? ""),
      finalPrice: Number(billing.finalPrice ?? 0),
      status: String(billing.status ?? ""),
      paid: billing.paid === true,
    }));

  const listRow = batchToListRow(batch);
  return {
    _id: String(batch._id),
    seasonYear: Number(batch.seasonYear ?? 0),
    executedAt: String(batch.executedAt ?? ""),
    transportTotal: Number(batch.transportTotal ?? 0),
    totalDunam: Number(batch.totalDunam ?? 0),
    pricePerDunam: Number(batch.pricePerDunam ?? 0),
    transportRowCount: Number(listRow.transportRowCount ?? 0),
    billsCount: Number(listRow.billsCount ?? 0),
    customerBillings,
  };
}

export async function cancelTransportGlobalChargeMock(id: string): Promise<void> {
  const index = globalChargeStore.findIndex((row) => row._id === id);
  if (index === -1) {
    throw new Error("לא נמצא");
  }

  const batch = globalChargeStore[index];
  const billingIds = toIdArray(batch.customerBillingIds);
  const billings = await listCollection("customerBillingTrackings");

  for (const billingId of billingIds) {
    const billing = billings.find((row) => row._id === billingId);
    if (billing?.paid === true) {
      throw new Error(PAID_BILLING_DELETE_ERROR);
    }
  }

  const transportIds = toIdArray(batch.transportTrackingIds);
  for (const transportId of transportIds) {
    await updateDocument("transportTrackings", transportId, {
      wasCharged: false,
    });
  }

  for (const billingId of billingIds) {
    await deleteCustomerBillingForGlobalChargeCancelMock(billingId);
  }

  globalChargeStore.splice(index, 1);
}

export async function previewGlobalTransportChargeMock(
  seasonYear: number,
): Promise<GlobalTransportChargePreview> {
  const data = await computeChargeData(seasonYear);
  return {
    seasonYear,
    transportTotal: data.transportTotal,
    transportRowCount: data.transportRows.length,
    totalDunam: data.totalDunam,
    pricePerDunam: data.pricePerDunam,
    plotCount: data.plotCount,
    customerCount: data.customerGroups.length,
  };
}

export async function executeGlobalTransportChargeMock(
  seasonYear: number,
): Promise<GlobalTransportChargeResult> {
  const preview = await previewGlobalTransportChargeMock(seasonYear);
  const data = await computeChargeData(seasonYear);
  const executedAt = new Date();
  const billDate = executedAt.toLocaleDateString("he-IL");
  const customerBillingIds: string[] = [];
  const transportTrackingIds = data.transportRows.map((row) => String(row._id));

  for (const group of data.customerGroups) {
    const plotLines = group.plots.map((plot) => ({
      plotName: plot.name,
      dunam: plot.dunam,
      linePrice: data.plotLinePrices.get(plot._id) ?? 0,
    }));

    const storedBillDocument = buildGlobalTransportBillDocument({
      customerName: group.customerName,
      billDate,
      pricePerDunam: data.pricePerDunam,
      plotLines,
    });

    const created = await createDocument("customerBillingTrackings", {
      date: executedAt.toISOString().slice(0, 10),
      customer: group.customerId,
      billKind: "globalTransport",
      storedBillDocument,
      notes: "",
      status: "לא אושר כלל",
      paid: false,
      finalPrice: storedBillDocument.total,
      operationsTrackingIds: [],
      materialUsageTrackingIds: [],
      contractorTrackingIds: [],
      baleOrderTrackingIds: [],
      transportTrackingIds: [],
    });
    customerBillingIds.push(String(created._id));
  }

  for (const row of data.transportRows) {
    await updateDocument("transportTrackings", String(row._id), {
      wasCharged: true,
    });
  }

  const batchId = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  globalChargeStore.push({
    _id: batchId,
    seasonYear,
    executedAt: executedAt.toISOString().slice(0, 10),
    transportTotal: data.transportTotal,
    totalDunam: data.totalDunam,
    pricePerDunam: data.pricePerDunam,
    transportTrackingIds,
    customerBillingIds,
  });

  return {
    ...preview,
    globalChargeId: batchId,
    billsCreated: customerBillingIds.length,
    customerBillingIds,
  };
}
