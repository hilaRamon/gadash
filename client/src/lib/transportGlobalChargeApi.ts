import api from "./api";

export type GlobalTransportChargePreview = {
  seasonYear: number;
  transportTotal: number;
  transportRowCount: number;
  totalDunam: number;
  pricePerDunam: number;
  plotCount: number;
  customerCount: number;
};

export type GlobalTransportChargeResult = GlobalTransportChargePreview & {
  globalChargeId: string;
  billsCreated: number;
  customerBillingIds: string[];
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
  customerBillings: Array<{
    _id: string;
    customerName?: string;
    finalPrice?: number;
    status?: string;
    paid?: boolean;
  }>;
};

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

export async function fetchGlobalTransportChargePreview(
  seasonYear: number,
): Promise<GlobalTransportChargePreview> {
  if (useMock) {
    const { previewGlobalTransportChargeMock } = await import(
      "./transportGlobalChargeMock"
    );
    return previewGlobalTransportChargeMock(seasonYear);
  }
  const { data } = await api.get<GlobalTransportChargePreview>(
    "/api/transport-global-charges/preview",
    { params: { season: seasonYear } },
  );
  return data;
}

export async function executeGlobalTransportCharge(
  seasonYear: number,
): Promise<GlobalTransportChargeResult> {
  if (useMock) {
    const { executeGlobalTransportChargeMock } = await import(
      "./transportGlobalChargeMock"
    );
    return executeGlobalTransportChargeMock(seasonYear);
  }
  const { data } = await api.post<GlobalTransportChargeResult>(
    "/api/transport-global-charges",
    { season: seasonYear },
  );
  return data;
}

export async function listTransportGlobalCharges(
  seasonYear?: number,
): Promise<Record<string, unknown>[]> {
  if (useMock) {
    const { listTransportGlobalChargesMock } = await import(
      "./transportGlobalChargeMock"
    );
    return listTransportGlobalChargesMock(seasonYear);
  }
  const { data } = await api.get<Record<string, unknown>[]>(
    "/api/transport-global-charges",
    { params: seasonYear != null ? { season: seasonYear } : undefined },
  );
  return data;
}

export async function fetchTransportGlobalChargeDetail(
  id: string,
): Promise<GlobalTransportChargeDetail> {
  if (useMock) {
    const { fetchTransportGlobalChargeDetailMock } = await import(
      "./transportGlobalChargeMock"
    );
    return fetchTransportGlobalChargeDetailMock(id);
  }
  const { data } = await api.get<GlobalTransportChargeDetail>(
    `/api/transport-global-charges/${id}`,
  );
  return data;
}

export async function cancelTransportGlobalCharge(id: string): Promise<void> {
  if (useMock) {
    const { cancelTransportGlobalChargeMock } = await import(
      "./transportGlobalChargeMock"
    );
    return cancelTransportGlobalChargeMock(id);
  }
  await api.delete(`/api/transport-global-charges/${id}`);
}
