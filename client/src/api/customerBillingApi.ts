/**
 * Client API for customer billing: unbilled preview, bill HTML/PDF, create billing.
 *
 * Bill data comes from the server; the client only renders JSON/HTML.
 *
 * UnbilledPreview is the payload for create-billing tables (four tracking arrays).
 * Bill preview/PDF use a separate endpoint that builds the invoice document server-side.
 */
import api from "./api";
import { buildCustomerBillDownloadFilename } from "@/lib/customerBill/downloadFilename";
import type { CustomerBillRequest } from "@/lib/customerBill/types";
import type { CollectionDocument } from "@/schema/types";
import { isTransportBillingRow } from "@/lib/transportTrackingBilling";
import { isGlobalTransportAllocationRow } from "@/lib/transportGlobalAllocationBilling";

function splitIncludedContractorRows(rows: CollectionDocument[]): {
  contractorTrackingIds: string[];
  transportTrackingIds: string[];
  globalTransportAllocationIds: string[];
} {
  const contractorTrackingIds: string[] = [];
  const transportTrackingIds: string[] = [];
  const globalTransportAllocationIds: string[] = [];

  for (const row of rows) {
    if (isTransportBillingRow(row)) {
      transportTrackingIds.push(row._id);
    } else if (isGlobalTransportAllocationRow(row)) {
      globalTransportAllocationIds.push(row._id);
    } else {
      contractorTrackingIds.push(row._id);
    }
  }

  return {
    contractorTrackingIds,
    transportTrackingIds,
    globalTransportAllocationIds,
  };
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

export async function fetchCustomersWithUnbilled(): Promise<CustomerWithUnbilled[]> {
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
  const { contractorTrackingIds, transportTrackingIds, globalTransportAllocationIds } =
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
    globalTransportAllocationIds,
  };
}

export function hasIncludedBillItems(request: CustomerBillRequest): boolean {
  return (
    request.operationsTrackingIds.length +
      request.contractorTrackingIds.length +
      request.materialUsageTrackingIds.length +
      request.baleOrderTrackingIds.length +
      request.transportTrackingIds.length +
      request.globalTransportAllocationIds.length >
    0
  );
}

export async function fetchSavedBillingBillPreview(
  billing: CollectionDocument,
): Promise<{ html: string }> {
  const { data } = await api.get<{ html: string }>(
    `/api/customerBillingTrackings/${billing._id}/bill-preview`,
  );
  return data;
}

/** Invoice HTML for selected rows — POST bill-preview on server. */
export async function fetchCustomerBillPreview(
  request: CustomerBillRequest,
): Promise<{ html: string }> {
  if (!hasIncludedBillItems(request)) {
    return { html: "" };
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

export async function createCustomerBilling(request: CustomerBillRequest) {
  if (!hasIncludedBillItems(request)) {
    throw new Error("יש לבחור לפחות פריט אחד לחיוב");
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
      throw new Error(await readBlobErrorMessage(error.response.data), {
        cause: error,
      });
    }
    throw error;
  }
}
