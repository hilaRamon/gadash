import api from "./api";

export type GlobalTransportChargePreviewCustomer = {
  customerName: string;
  dunam: number;
  price: number;
};

export type GlobalTransportChargePreview = {
  seasonYear: number;
  transportTotal: number;
  transportRowCount: number;
  totalDunam: number;
  pricePerDunam: number;
  plotCount: number;
  customerCount: number;
  customers: GlobalTransportChargePreviewCustomer[];
};

export type GlobalTransportChargeResult = GlobalTransportChargePreview & {
  globalChargeId: string;
  allocationsCreated: number;
};

export type GlobalTransportAllocationDetail = {
  _id: string;
  customer: string;
  customerName: string;
  dunam: number;
  pricePerDunam: number;
  finalPrice: number;
  wasCharged: boolean;
};

export type GlobalTransportChargeDetail = {
  _id: string;
  seasonYear: number;
  executedAt: string;
  transportTotal: number;
  totalDunam: number;
  pricePerDunam: number;
  transportRowCount: number;
  billsCount: number;
  allocations: GlobalTransportAllocationDetail[];
};

export async function fetchGlobalTransportChargePreview(
  seasonYear: number,
): Promise<GlobalTransportChargePreview> {
  const { data } = await api.get<GlobalTransportChargePreview>(
    "/api/transport-global-charges/preview",
    { params: { season: seasonYear } },
  );
  return data;
}

export async function executeGlobalTransportCharge(
  seasonYear: number,
): Promise<GlobalTransportChargeResult> {
  const { data } = await api.post<GlobalTransportChargeResult>(
    "/api/transport-global-charges",
    { season: seasonYear },
  );
  return data;
}

export async function listTransportGlobalCharges(
  seasonYear?: number,
): Promise<Record<string, unknown>[]> {
  const { data } = await api.get<Record<string, unknown>[]>(
    "/api/transport-global-charges",
    { params: seasonYear != null ? { season: seasonYear } : undefined },
  );
  return data;
}

export async function fetchTransportGlobalChargeDetail(
  id: string,
): Promise<GlobalTransportChargeDetail> {
  const { data } = await api.get<GlobalTransportChargeDetail>(
    `/api/transport-global-charges/${id}`,
  );
  return data;
}

export async function cancelTransportGlobalCharge(id: string): Promise<void> {
  await api.delete(`/api/transport-global-charges/${id}`);
}
