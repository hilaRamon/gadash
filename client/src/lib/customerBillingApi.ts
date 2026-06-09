import api from "./api";
import { listCollection } from "./collectionApi";
import { buildCustomerBillDocumentFromPreview } from "./customerBill/buildCustomerBillData";
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

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

export type CustomerWithUnbilled = {
  _id: string;
  name: string;
};

export type UnbilledPreview = {
  operations: CollectionDocument[];
  materialUsage: CollectionDocument[];
  baleOrders: CollectionDocument[];
  contractors: CollectionDocument[];
};

async function fetchUnbilledPreviewMock(
  customerId: string,
): Promise<UnbilledPreview> {
  const [operations, materialUsage, baleOrders, contractors] = await Promise.all([
    listCollection("operationsTrackings"),
    listCollection("materialUsageTrackings"),
    listCollection("baleOrderTrackings"),
    listCollection("contractorTrackings"),
  ]);

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
    contractors: contractors.filter((row) =>
      isUnbilledContractorForCustomer(row, customerId),
    ),
  };
}

async function fetchCustomersWithUnbilledMock(): Promise<CustomerWithUnbilled[]> {
  const [operations, materialUsage, baleOrders, contractors, customers] =
    await Promise.all([
      listCollection("operationsTrackings"),
      listCollection("materialUsageTrackings"),
      listCollection("baleOrderTrackings"),
      listCollection("contractorTrackings"),
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

export function buildCustomerBillRequest(
  customerId: string,
  preview: UnbilledPreview,
  includedIds: Set<string>,
): CustomerBillRequest {
  return {
    customerId,
    operationsTrackingIds: preview.operations
      .filter((row) => includedIds.has(row._id))
      .map((row) => row._id),
    contractorTrackingIds: preview.contractors
      .filter((row) => includedIds.has(row._id))
      .map((row) => row._id),
    materialUsageTrackingIds: preview.materialUsage
      .filter((row) => includedIds.has(row._id))
      .map((row) => row._id),
    baleOrderTrackingIds: preview.baleOrders
      .filter((row) => includedIds.has(row._id))
      .map((row) => row._id),
  };
}

export function hasIncludedBillItems(request: CustomerBillRequest): boolean {
  return (
    request.operationsTrackingIds.length +
      request.contractorTrackingIds.length +
      request.materialUsageTrackingIds.length +
      request.baleOrderTrackingIds.length >
    0
  );
}

async function fetchCustomerBillPreviewMock(
  request: CustomerBillRequest,
  customerName: string,
  preview: UnbilledPreview,
): Promise<{ html: string }> {
  const bill = buildCustomerBillDocumentFromPreview({
    customerName,
    customerId: request.customerId,
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
  return { html: renderCustomerBillPreviewHtml(bill) };
}

export async function fetchCustomerBillPreview(
  request: CustomerBillRequest,
  options: { customerName: string; preview: UnbilledPreview },
): Promise<{ html: string }> {
  if (!hasIncludedBillItems(request)) {
    return { html: "" };
  }
  if (useMock) {
    return fetchCustomerBillPreviewMock(
      request,
      options.customerName,
      options.preview,
    );
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
