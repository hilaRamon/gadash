/**
 * Client API for customer billing: unbilled preview, bill HTML/PDF, create billing.
 *
 * When VITE_USE_MOCK !== "false", list/filter mock collections locally.
 * Otherwise all bill data comes from the server; the client only renders JSON/HTML.
 *
 * UnbilledPreview is the payload for create-billing tables (four tracking arrays).
 * Bill preview/PDF use a separate endpoint that builds the invoice document server-side.
 */
import api from "./api";
import { createDocument, listCollection, updateDocument } from "./collectionApi";
import {
  buildCustomerBillDocumentFromPreview,
  buildCustomerBillDocumentFromRows,
} from "./customerBill/buildCustomerBillData";
import { buildCustomerBillDownloadFilename } from "./customerBill/downloadFilename";
import { renderCustomerBillPreviewHtml } from "./customerBill/renderCustomerBillHtml";
import type { CustomerBillRequest } from "./customerBill/types";
import type { CollectionDocument } from "../schema/types";
import {
  isUnbilledBaleOrderForCustomer,
  isUnbilledContractorForCustomer,
  isUnbilledMaterialUsageForCustomer,
  isUnbilledOperationForCustomer,
  isUncharged,
  isBillable,
  isFuelOperation,
} from "./unbilledTrackingFilters";
import {
  isTransportBillingRow,
  isUnbilledTransportForCustomer,
  transportTrackingToContractorBillingRow,
} from "./transportTrackingBilling";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

function splitIncludedContractorRows(rows: CollectionDocument[]): {
  contractorTrackingIds: string[];
  transportTrackingIds: string[];
} {
  const contractorTrackingIds: string[] = [];
  const transportTrackingIds: string[] = [];

  for (const row of rows) {
    if (isTransportBillingRow(row)) {
      transportTrackingIds.push(row._id);
    } else {
      contractorTrackingIds.push(row._id);
    }
  }

  return { contractorTrackingIds, transportTrackingIds };
}

export function countCustomerPlots(
  plots: CollectionDocument[],
  customerId: string,
): number {
  if (!customerId) return 0;
  return plots.filter((plot) => String(plot.customer ?? "") === customerId).length;
}

async function customerHasMultiplePlotsMock(customerId: string): Promise<boolean> {
  const plots = await listCollection("plots");
  return countCustomerPlots(plots, customerId) > 1;
}

export type CustomerWithUnbilled = {
  _id: string;
  name: string;
};

/** Row arrays returned by unbilled-preview; split into four tables on the client. */
export type UnbilledPreview = {
  operations: CollectionDocument[];
  materialUsage: CollectionDocument[];
  baleOrders: CollectionDocument[];
  contractors: CollectionDocument[];
};

/** Mock: load all trackings from in-memory store and filter by customer + uncharged rules. */
async function fetchUnbilledPreviewMock(
  customerId: string,
): Promise<UnbilledPreview> {
  const [operations, materialUsage, baleOrders, contractors, transportTrackings] =
    await Promise.all([
    listCollection("operationsTrackings"),
    listCollection("materialUsageTrackings"),
    listCollection("baleOrderTrackings"),
    listCollection("contractorTrackings"),
    listCollection("transportTrackings"),
  ]);

  const transportRows = transportTrackings
    .filter((row) => isUnbilledTransportForCustomer(row, customerId))
    .map(transportTrackingToContractorBillingRow);

  return {
    operations: operations.filter((row) =>
      isUnbilledOperationForCustomer(row, customerId),
    ),
    materialUsage: materialUsage.filter((row) =>
      isUnbilledMaterialUsageForCustomer(row, customerId),
    ),
    baleOrders: baleOrders.filter((row) =>
      isUnbilledBaleOrderForCustomer(row, customerId),
    ),
    contractors: [
      ...contractors.filter((row) =>
        isUnbilledContractorForCustomer(row, customerId),
      ),
      ...transportRows,
    ],
  };
}

async function fetchCustomersWithUnbilledMock(): Promise<CustomerWithUnbilled[]> {
  const [operations, materialUsage, baleOrders, contractors, transportTrackings, customers] =
    await Promise.all([
      listCollection("operationsTrackings"),
      listCollection("materialUsageTrackings"),
      listCollection("baleOrderTrackings"),
      listCollection("contractorTrackings"),
      listCollection("transportTrackings"),
      listCollection("customers"),
    ]);

  const customerIds = new Set<string>();

  for (const row of baleOrders) {
    if (isUncharged(row) && row.customer) {
      customerIds.add(String(row.customer));
    }
  }

  for (const row of operations) {
    if (
      isUncharged(row) &&
      isBillable(row) &&
      row.plot != null &&
      row.plot !== "" &&
      !isFuelOperation(row)
    ) {
      const id = String(row.customer ?? "");
      if (id) customerIds.add(id);
    }
  }

  for (const row of materialUsage) {
    if (isUncharged(row) && isBillable(row)) {
      const id = String(row.customer ?? "");
      if (id) customerIds.add(id);
    }
  }

  for (const row of contractors) {
    if (isUncharged(row)) {
      const id = String(row.customer ?? "");
      if (id) customerIds.add(id);
    }
  }

  for (const row of transportTrackings) {
    if (isUncharged(row) && row.customer) {
      const id = String(row.customer);
      if (isUnbilledTransportForCustomer(row, id)) {
        customerIds.add(id);
      }
    }
  }

  return customers
    .filter((c) => customerIds.has(c._id))
    .map((c) => ({ _id: c._id, name: String(c.name ?? "") }))
    .sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export async function fetchCustomersWithUnbilled(): Promise<CustomerWithUnbilled[]> {
  if (useMock) return fetchCustomersWithUnbilledMock();
  const { data } = await api.get<{ customers: CustomerWithUnbilled[] }>(
    "/api/customerBillingTrackings/customers-with-unbilled",
  );
  return data.customers;
}

/** Unbilled trackings for one customer — used by CreateCustomerBillingSections tables. */
export async function fetchUnbilledPreview(
  customerId: string,
): Promise<UnbilledPreview> {
  if (!customerId) {
    return {
      operations: [],
      materialUsage: [],
      baleOrders: [],
      contractors: [],
    };
  }
  if (useMock) return fetchUnbilledPreviewMock(customerId);
  const { data } = await api.get<UnbilledPreview>(
    "/api/customerBillingTrackings/unbilled-preview",
    { params: { customerId } },
  );
  return data;
}

/** Maps checked table rows to the IDs sent when creating a bill or fetching bill HTML/PDF. */
export function buildCustomerBillRequest(
  customerId: string,
  preview: UnbilledPreview,
  includedIds: Set<string>,
): CustomerBillRequest {
  const includedContractors = preview.contractors.filter((row) =>
    includedIds.has(row._id),
  );
  const { contractorTrackingIds, transportTrackingIds } =
    splitIncludedContractorRows(includedContractors);

  return {
    customerId,
    operationsTrackingIds: preview.operations
      .filter((row) => includedIds.has(row._id))
      .map((row) => row._id),
    contractorTrackingIds,
    materialUsageTrackingIds: preview.materialUsage
      .filter((row) => includedIds.has(row._id))
      .map((row) => row._id),
    baleOrderTrackingIds: preview.baleOrders
      .filter((row) => includedIds.has(row._id))
      .map((row) => row._id),
    transportTrackingIds,
  };
}

export function hasIncludedBillItems(request: CustomerBillRequest): boolean {
  return (
    request.operationsTrackingIds.length +
      request.contractorTrackingIds.length +
      request.materialUsageTrackingIds.length +
      request.baleOrderTrackingIds.length +
      request.transportTrackingIds.length >
    0
  );
}

function pickRowsByIds(
  rows: CollectionDocument[],
  ids: string[],
): CollectionDocument[] {
  if (ids.length === 0) return [];
  const idSet = new Set(ids);
  return rows.filter((row) => idSet.has(row._id));
}

/** Mock only: build invoice HTML from fresh collection rows (not cached preview). */
async function fetchCustomerBillPreviewMock(
  request: CustomerBillRequest,
  customerName: string,
): Promise<{ html: string }> {
  const showPlots = await customerHasMultiplePlotsMock(request.customerId);
  const [operations, materialUsage, baleOrders, contractors, transportTrackings] =
    await Promise.all([
    listCollection("operationsTrackings"),
    listCollection("materialUsageTrackings"),
    listCollection("baleOrderTrackings"),
    listCollection("contractorTrackings"),
    listCollection("transportTrackings"),
  ]);

  const transportRows = pickRowsByIds(
    transportTrackings,
    request.transportTrackingIds,
  ).map(transportTrackingToContractorBillingRow);

  const bill = buildCustomerBillDocumentFromRows({
    customerName,
    showPlots,
    operations: pickRowsByIds(operations, request.operationsTrackingIds),
    contractors: [
      ...pickRowsByIds(contractors, request.contractorTrackingIds),
      ...transportRows,
    ],
    materialUsage: pickRowsByIds(
      materialUsage,
      request.materialUsageTrackingIds,
    ),
    baleOrders: pickRowsByIds(baleOrders, request.baleOrderTrackingIds),
  });
  return { html: renderCustomerBillPreviewHtml(bill) };
}

function toIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "")).filter(Boolean);
}

function formatStoredBillDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString("he-IL");
  }
  return date.toLocaleDateString("he-IL");
}

async function fetchSavedBillingBillPreviewMock(
  billing: CollectionDocument,
): Promise<{ html: string }> {
  const customerName = String(billing.customerName ?? "").trim() || "לקוח";
  const [operations, materialUsage, baleOrders, contractors, transportTrackings] =
    await Promise.all([
    listCollection("operationsTrackings"),
    listCollection("materialUsageTrackings"),
    listCollection("baleOrderTrackings"),
    listCollection("contractorTrackings"),
    listCollection("transportTrackings"),
  ]);

  const transportRows = pickRowsByIds(
    transportTrackings,
    toIdArray(billing.transportTrackingIds),
  ).map(transportTrackingToContractorBillingRow);

  const showPlots = await customerHasMultiplePlotsMock(
    String(billing.customer ?? ""),
  );
  const bill = buildCustomerBillDocumentFromRows({
    customerName,
    billDate: formatStoredBillDate(billing.date),
    showPlots,
    operations: pickRowsByIds(operations, toIdArray(billing.operationsTrackingIds)),
    contractors: [
      ...pickRowsByIds(contractors, toIdArray(billing.contractorTrackingIds)),
      ...transportRows,
    ],
    materialUsage: pickRowsByIds(
      materialUsage,
      toIdArray(billing.materialUsageTrackingIds),
    ),
    baleOrders: pickRowsByIds(baleOrders, toIdArray(billing.baleOrderTrackingIds)),
  });

  return { html: renderCustomerBillPreviewHtml(bill) };
}

export async function fetchSavedBillingBillPreview(
  billing: CollectionDocument,
): Promise<{ html: string }> {
  if (useMock) {
    return fetchSavedBillingBillPreviewMock(billing);
  }
  const { data } = await api.get<{ html: string }>(
    `/api/customerBillingTrackings/${billing._id}/bill-preview`,
  );
  return data;
}

/** Invoice HTML for selected rows — POST bill-preview on server (mock builds locally). */
export async function fetchCustomerBillPreview(
  request: CustomerBillRequest,
  options: { customerName: string; preview: UnbilledPreview },
): Promise<{ html: string }> {
  if (!hasIncludedBillItems(request)) {
    return { html: "" };
  }
  if (useMock) {
    return fetchCustomerBillPreviewMock(request, options.customerName);
  }
  const { data } = await api.post<{ html: string }>(
    "/api/customerBillingTrackings/bill-preview",
    request,
  );
  return data;
}

async function readBlobErrorMessage(data: Blob): Promise<string> {
  try {
    const text = await data.text();
    const parsed = JSON.parse(text) as { error?: string };
    return parsed.error ?? text;
  } catch {
    return "שגיאה בהורדת הקובץ";
  }
}

async function createCustomerBillingMock(
  request: CustomerBillRequest,
  customerName: string,
  preview: UnbilledPreview,
) {
  const showPlots = await customerHasMultiplePlotsMock(request.customerId);
  const bill = buildCustomerBillDocumentFromPreview({
    customerName,
    customerId: request.customerId,
    showPlots,
    operations: preview.operations.filter((row) =>
      request.operationsTrackingIds.includes(row._id),
    ),
    contractors: preview.contractors.filter((row) =>
      request.contractorTrackingIds.includes(row._id),
    ),
    materialUsage: preview.materialUsage.filter((row) =>
      request.materialUsageTrackingIds.includes(row._id),
    ),
    baleOrders: preview.baleOrders.filter((row) =>
      request.baleOrderTrackingIds.includes(row._id),
    ),
  });

  const created = await createDocument("customerBillingTrackings", {
    date: new Date().toISOString().slice(0, 10),
    customer: request.customerId,
    finalPrice: bill.total,
    status: "לא אושר כלל",
    paid: false,
    notes: "",
    operationsTrackingIds: request.operationsTrackingIds,
    materialUsageTrackingIds: request.materialUsageTrackingIds,
    contractorTrackingIds: request.contractorTrackingIds,
    baleOrderTrackingIds: request.baleOrderTrackingIds,
    transportTrackingIds: request.transportTrackingIds,
  });

  await Promise.all([
    ...request.operationsTrackingIds.map((id) =>
      updateDocument("operationsTrackings", id, { wasCharged: true }),
    ),
    ...request.contractorTrackingIds.map((id) =>
      updateDocument("contractorTrackings", id, { wasCharged: true }),
    ),
    ...request.materialUsageTrackingIds.map((id) =>
      updateDocument("materialUsageTrackings", id, { wasCharged: true }),
    ),
    ...request.baleOrderTrackingIds.map((id) =>
      updateDocument("baleOrderTrackings", id, { wasCharged: true }),
    ),
    ...request.transportTrackingIds.map((id) =>
      updateDocument("transportTrackings", id, { wasCharged: true }),
    ),
  ]);

  return created;
}

export async function createCustomerBilling(
  request: CustomerBillRequest,
  options: { customerName: string; preview: UnbilledPreview },
) {
  if (!hasIncludedBillItems(request)) {
    throw new Error("יש לבחור לפחות פריט אחד לחיוב");
  }
  if (useMock) {
    return createCustomerBillingMock(
      request,
      options.customerName,
      options.preview,
    );
  }
  const { data } = await api.post(
    "/api/customerBillingTrackings/create-from-selection",
    request,
  );
  return data;
}

export async function downloadCustomerBillPdf(
  request: CustomerBillRequest,
  customerName: string,
): Promise<void> {
  if (useMock) {
    throw new Error("הורדת PDF זמינה רק עם שרת");
  }
  try {
    const { data } = await api.post<Blob>(
      "/api/customerBillingTrackings/bill-pdf",
      { ...request, customerName },
      { responseType: "blob" },
    );
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildCustomerBillDownloadFilename(customerName);
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response &&
      error.response.data instanceof Blob
    ) {
      throw new Error(await readBlobErrorMessage(error.response.data));
    }
    throw error;
  }
}
