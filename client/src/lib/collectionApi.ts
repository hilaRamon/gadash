import api from "./api";
import { contractorsSeedData } from "../data/contractorsSeed";
import { moversSeedData } from "../data/moversSeed";
import { customersSeedData } from "../data/customersSeed";
import { employeesSeedData } from "../data/employeesSeed";
import { plotsSeedData } from "../data/plotsSeed";
import { agriculturalSeasonsSeedData } from "../data/agriculturalSeasonsSeed";
import { fuelTanksSeedData } from "../data/fuelTanksSeed";
import { materialsSeedData } from "../data/materialsSeed";
import { balesSeedData } from "../data/balesSeed";
import { operationsSeedData } from "../data/operationsSeed";
import { tractorsSeedData } from "../data/tractorsSeed";
import { suppliersSeedData } from "../data/suppliersSeed";
import { materialPurchaseTrackingsSeedData } from "../data/materialPurchaseTrackingsSeed";
import { materialUsageTrackingsSeedData } from "../data/materialUsageTrackingsSeed";
import type { CollectionDocument } from "../schema/types";
import { calcBaleOrderFinalPrice, resolveBaleOrderPrices } from "./baleOrderPricing";
import type { TableQueryParams } from "../schema/tableQuery";
import {
  calcFinalPrice,
  resolveUnitAmount,
} from "./contractorTrackingPricing";
import {
  calcFinalPrice as calcTransportFinalPrice,
  calcHoursBetween as calcTransportHours,
} from "./transportTrackingPricing";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

const mockStores = new Map<string, CollectionDocument[]>();

function seedMockData(collection: string): CollectionDocument[] {
  if (collection === "employees") {
    return employeesSeedData.map((row) => ({ ...row }));
  }
  if (collection === "customers") {
    return customersSeedData.map((row) => ({ ...row }));
  }
  if (collection === "contractors") {
    return contractorsSeedData.map((row) => ({ ...row }));
  }
  if (collection === "movers") {
    return moversSeedData.map((row) => ({ ...row }));
  }
  if (collection === "suppliers") {
    return suppliersSeedData.map((row) => ({ ...row }));
  }
  if (collection === "tractors") {
    return tractorsSeedData.map((row) => ({ ...row }));
  }
  if (collection === "operations") {
    return operationsSeedData.map((row) => ({ ...row }));
  }
  if (collection === "materials") {
    return materialsSeedData.map((row) => ({ ...row }));
  }
  if (collection === "bales") {
    return balesSeedData.map((row) => ({ ...row }));
  }
  if (collection === "plots") {
    return plotsSeedData.map((row) => ({ ...row }));
  }
  if (collection === "agriculturalSeasons") {
    return agriculturalSeasonsSeedData.map((row) => ({ ...row }));
  }
  if (collection === "fuelTanks") {
    return fuelTanksSeedData.map((row) => ({ ...row }));
  }
  if (collection === "materialPurchaseTrackings") {
    return materialPurchaseTrackingsSeedData.map((row) => ({ ...row }));
  }
  if (collection === "materialUsageTrackings") {
    return materialUsageTrackingsSeedData.map((row) => ({ ...row }));
  }

  const labels: Record<string, string> = {
    employees: "עובד",
    customers: "לקוח",
    contractors: "קבלן",
    movers: "מוביל",
    suppliers: "ספק",
    operations: "פעולה",
    materials: "חומר",
    bales: "חבילה",
    tractors: "כלי",
    plots: "חלקה",
    fuelTanks: "מיכל",
    agriculturalSeasons: "עונה",
    materialPurchaseTrackings: "רכש חומר",
    materialUsageTrackings: "שימוש חומר",
    fuelOperationsTrackings: "פעולת דלק",
    baleOrderTrackings: "הזמנת חבילות",
    contractorTrackings: "מעקב קבלן",
    transportTrackings: "מעקב הובלה",
  };
  const prefix = labels[collection] ?? "פריט";

  return Array.from({ length: 5 }, (_, i) => ({
    _id: `${collection.padEnd(12, "0").slice(0, 12)}${String(i + 1).padStart(12, "0")}`,
    name: `${prefix} ${i + 1}`,
    notes: i % 2 === 0 ? "הערה לדוגמה" : "",
  }));
}

function getMockStore(collection: string): CollectionDocument[] {
  if (!mockStores.has(collection)) {
    mockStores.set(collection, seedMockData(collection));
  }
  return mockStores.get(collection)!;
}

function calcMaterialUsageFinalPrice(row: Record<string, unknown>): number {
  const materialId = String(row.material ?? "");
  const material = materialsSeedData.find((m) => String(m._id) === materialId);
  const unitPrice = Number(material?.customerCost ?? 0);
  const amount = Number(row.amount ?? 0);
  if (!Number.isFinite(unitPrice) || !Number.isFinite(amount)) return 0;
  return Number((unitPrice * amount).toFixed(2));
}

function enrichMaterialUsageRow(row: CollectionDocument): CollectionDocument {
  const finalPrice = calcMaterialUsageFinalPrice(row);
  return { ...row, finalPrice };
}

function calcOperationTrackingFinalPrice(row: Record<string, unknown>): number {
  if (row.billable === false) return 0;

  const operation = operationsSeedData.find(
    (item) => String(item._id) === String(row.operation ?? ""),
  );
  const plot = plotsSeedData.find(
    (item) => String(item._id) === String(row.plot ?? ""),
  );
  const unitCost = Number(operation?.currentCost ?? 0);
  const dunam = Number(plot?.dunam ?? 0);
  if (
    !Number.isFinite(unitCost) ||
    !Number.isFinite(dunam) ||
    unitCost < 0 ||
    dunam < 0
  ) {
    return 0;
  }
  return Number((dunam * unitCost).toFixed(2));
}

function enrichOperationTrackingRow(
  row: CollectionDocument,
): CollectionDocument {
  const operation = operationsSeedData.find(
    (item) => String(item._id) === String(row.operation ?? ""),
  );
  const plot =
    row.plot == null || row.plot === ""
      ? null
      : plotsSeedData.find((item) => String(item._id) === String(row.plot));
  const employee = employeesSeedData.find(
    (item) => String(item._id) === String(row.employee ?? ""),
  );
  return {
    ...row,
    operationName: String(operation?.name ?? ""),
    operationType: String(operation?.operationType ?? ""),
    customer: plot?.customer ?? null,
    customerName: String(plot?.customerName ?? ""),
    plotName: plot ? String(plot.name ?? "") : null,
    employeeName: String(employee?.name ?? ""),
    finalPrice: calcOperationTrackingFinalPrice(row),
  };
}

function enrichBaleOrderTrackingRow(row: CollectionDocument): CollectionDocument {
  const bale = balesSeedData.find(
    (item) => String(item._id) === String(row.bale ?? ""),
  );
  const customer = customersSeedData.find(
    (item) => String(item._id) === String(row.customer ?? ""),
  );
  const { pricePerTon, pricePerUnit } = resolveBaleOrderPrices({
    pricePerTon: row.pricePerTon,
    pricePerUnit: row.pricePerUnit,
    bale: bale
      ? { pricePerTon: bale.pricePerTon, pricePerUnit: bale.pricePerUnit }
      : null,
  });
  const finalPrice = calcBaleOrderFinalPrice({
    quantity: row.quantity,
    weight: row.weight,
    pricePerTon,
    pricePerUnit,
    transportPrice: row.transportPrice,
  });

  return {
    ...row,
    baleName: String(bale?.name ?? ""),
    customerName: String(customer?.name ?? ""),
    pricePerTon,
    pricePerUnit,
    finalPrice,
    weighed: row.weighed === true,
  };
}

function enrichTransportTrackingRow(
  row: CollectionDocument,
): CollectionDocument {
  const mover = moversSeedData.find(
    (item) => String(item._id) === String(row.mover ?? ""),
  );
  const hours =
    calcTransportHours(
      String(row.startTime ?? ""),
      String(row.endTime ?? ""),
    ) ?? Number(row.hours ?? 0);
  const hourlyRate = Number(row.hourlyRate ?? 0);
  const finalPrice = calcTransportFinalPrice(hourlyRate, hours);

  return {
    ...row,
    moverName: String(mover?.name ?? ""),
    hours,
    finalPrice,
  };
}

function enrichContractorTrackingRow(
  row: CollectionDocument,
): CollectionDocument {
  const contractor = contractorsSeedData.find(
    (item) => String(item._id) === String(row.contractor ?? ""),
  );
  const plot = plotsSeedData.find(
    (item) => String(item._id) === String(row.plot ?? ""),
  );
  const operation = operationsSeedData.find(
    (item) => String(item._id) === String(row.operation ?? ""),
  );
  const pricingForm = String(row.pricingForm ?? "");
  const unitAmount =
    resolveUnitAmount(pricingForm, {
      startTime: String(row.startTime ?? ""),
      endTime: String(row.endTime ?? ""),
      unitAmount: String(row.unitAmount ?? ""),
    }) ?? Number(row.unitAmount ?? 0);
  const unitPrice = Number(row.unitPrice ?? 0);
  const finalPrice = calcFinalPrice(unitPrice, unitAmount);

  return {
    ...row,
    contractorName: String(contractor?.name ?? ""),
    plotName: String(plot?.name ?? ""),
    operationName: String(operation?.name ?? ""),
    unitAmount,
    finalPrice,
    customerPrice:
      row.customerPrice == null || row.customerPrice === ""
        ? null
        : Number(row.customerPrice),
  };
}

function enrichFuelOperationTrackingRow(
  row: CollectionDocument,
): CollectionDocument {
  const operation = operationsSeedData.find(
    (item) => String(item._id) === String(row.operation ?? ""),
  );
  const fuelTank = fuelTanksSeedData.find(
    (item) => String(item._id) === String(row.fuelTank ?? ""),
  );
  const employee = employeesSeedData.find(
    (item) => String(item._id) === String(row.employee ?? ""),
  );
  const tractor = tractorsSeedData.find(
    (item) => String(item._id) === String(row.tractor ?? ""),
  );
  return {
    ...row,
    operationName: String(operation?.name ?? ""),
    fuelTankName: String(fuelTank?.name ?? ""),
    employeeName: String(employee?.name ?? ""),
    tractorName: String(tractor?.name ?? ""),
  };
}

function applyFuelTankDeltaForMockCreate(row: CollectionDocument) {
  const operation = operationsSeedData.find(
    (item) => String(item._id) === String(row.operation ?? ""),
  );
  const fuelTank = fuelTanksSeedData.find(
    (item) => String(item._id) === String(row.fuelTank ?? ""),
  );
  if (!operation || !fuelTank) return;

  const amount = Number(row.amount ?? 0);
  if (!Number.isFinite(amount) || amount < 0) return;

  let delta = 0;
  if (String(operation.name) === "תדלוק") delta = -amount;
  if (String(operation.name) === "מילוי מיכל") delta = amount;
  if (delta === 0) return;

  const current = Number(fuelTank.currentAmount ?? 0);
  const next = Number((current + delta).toFixed(3));
  fuelTank.currentAmount = next < 0 ? 0 : next;
}

async function listMock(collection: string): Promise<CollectionDocument[]> {
  await delay(200);
  const rows = [...getMockStore(collection)];
  if (collection === "materialUsageTrackings") {
    return rows.map(enrichMaterialUsageRow);
  }
  if (collection === "operationsTrackings") {
    return rows.map(enrichOperationTrackingRow);
  }
  if (collection === "fuelOperationsTrackings") {
    return rows.map(enrichFuelOperationTrackingRow);
  }
  if (collection === "baleOrderTrackings") {
    return rows.map(enrichBaleOrderTrackingRow);
  }
  if (collection === "contractorTrackings") {
    return rows.map(enrichContractorTrackingRow);
  }
  if (collection === "transportTrackings") {
    return rows.map(enrichTransportTrackingRow);
  }
  return rows;
}

async function createMock(
  collection: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  await delay(150);
  const store = getMockStore(collection);
  const doc: CollectionDocument = {
    _id: crypto.randomUUID().replace(/-/g, "").slice(0, 24),
    ...body,
  } as CollectionDocument;
  if (collection === "materialUsageTrackings") {
    const plot = plotsSeedData.find(
      (p) => String(p._id) === String(doc.plot ?? ""),
    );
    doc.customer = plot?.customer ?? "";
    doc.customerName = String(plot?.customerName ?? "");
  }
  store.push(doc);
  if (collection === "materialUsageTrackings") {
    return enrichMaterialUsageRow(doc);
  }
  if (collection === "operationsTrackings") {
    const plotId = doc.plot;
    if (plotId != null && plotId !== "") {
      const plot = plotsSeedData.find(
        (p) => String(p._id) === String(plotId),
      );
      doc.customer = plot?.customer ?? "";
      doc.customerName = String(plot?.customerName ?? "");
    } else {
      doc.plot = null;
      doc.customer = null;
      doc.customerName = "";
    }
    return enrichOperationTrackingRow(doc);
  }
  if (collection === "fuelOperationsTrackings") {
    applyFuelTankDeltaForMockCreate(doc);
    return enrichFuelOperationTrackingRow(doc);
  }
  if (collection === "baleOrderTrackings") {
    return enrichBaleOrderTrackingRow(doc);
  }
  if (collection === "contractorTrackings") {
    return enrichContractorTrackingRow(doc);
  }
  if (collection === "transportTrackings") {
    return enrichTransportTrackingRow(doc);
  }
  return doc;
}

async function updateMock(
  collection: string,
  id: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  await delay(150);
  const store = getMockStore(collection);
  const index = store.findIndex((d) => d._id === id);
  if (index === -1) throw new Error("לא נמצא");
  store[index] = { ...store[index], ...body, _id: id };
  if (collection === "materialUsageTrackings") {
    const plot = plotsSeedData.find(
      (p) => String(p._id) === String(store[index].plot ?? ""),
    );
    store[index].customer = plot?.customer ?? "";
    store[index].customerName = String(plot?.customerName ?? "");
    return enrichMaterialUsageRow(store[index]);
  }
  if (collection === "operationsTrackings") {
    const plotId = store[index].plot;
    if (plotId != null && plotId !== "") {
      const plot = plotsSeedData.find(
        (p) => String(p._id) === String(plotId),
      );
      store[index].customer = plot?.customer ?? "";
      store[index].customerName = String(plot?.customerName ?? "");
    } else {
      store[index].plot = null;
      store[index].customer = null;
      store[index].customerName = "";
    }
    return enrichOperationTrackingRow(store[index]);
  }
  if (collection === "fuelOperationsTrackings") {
    return enrichFuelOperationTrackingRow(store[index]);
  }
  if (collection === "baleOrderTrackings") {
    return enrichBaleOrderTrackingRow(store[index]);
  }
  if (collection === "contractorTrackings") {
    return enrichContractorTrackingRow(store[index]);
  }
  if (collection === "transportTrackings") {
    return enrichTransportTrackingRow(store[index]);
  }
  return store[index];
}

async function removeMock(collection: string, id: string): Promise<void> {
  await delay(150);
  const store = getMockStore(collection);
  const index = store.findIndex((d) => d._id === id);
  if (index !== -1) store.splice(index, 1);
}

async function removeManyMock(
  collection: string,
  ids: string[],
): Promise<void> {
  await delay(200);
  const store = getMockStore(collection);
  for (const id of ids) {
    const index = store.findIndex((d) => d._id === id);
    if (index !== -1) store.splice(index, 1);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listCollection(
  collection: string,
  params?: TableQueryParams,
): Promise<CollectionDocument[]> {
  void params;
  if (useMock) return listMock(collection);
  const { data } = await api.get<CollectionDocument[]>(`/api/${collection}`);
  return data;
}

export async function createDocument(
  collection: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  if (useMock) return createMock(collection, body);
  const { data } = await api.post<CollectionDocument>(
    `/api/${collection}`,
    body,
  );
  return data;
}

export async function updateDocument(
  collection: string,
  id: string,
  body: Record<string, unknown>,
): Promise<CollectionDocument> {
  if (useMock) return updateMock(collection, id, body);
  const { data } = await api.put<CollectionDocument>(
    `/api/${collection}/${id}`,
    body,
  );
  return data;
}

export async function deleteDocument(
  collection: string,
  id: string,
): Promise<void> {
  if (useMock) return removeMock(collection, id);
  await api.delete(`/api/${collection}/${id}`);
}

export async function deleteManyDocuments(
  collection: string,
  ids: string[],
): Promise<void> {
  if (useMock) return removeManyMock(collection, ids);
  await api.post(`/api/${collection}/bulk-delete`, { ids });
}
