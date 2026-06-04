import api from "./api";
import { listCollection } from "./collectionApi";
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
