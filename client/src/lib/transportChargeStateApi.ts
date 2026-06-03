import api from "./api";
import { listCollection } from "./collectionApi";
import {
  defaultTransportPeriodStartDate,
  sumTransportFinalPricesInRange,
} from "./transportTrackingPricing";

export type TransportChargeState = {
  periodStartDate: string;
  totalSum: number;
};

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

let mockState: TransportChargeState = {
  periodStartDate: defaultTransportPeriodStartDate(),
  totalSum: 0,
};

async function recalcMockState(): Promise<TransportChargeState> {
  const rows = await listCollection("transportTrackings");
  mockState = {
    ...mockState,
    totalSum: sumTransportFinalPricesInRange(rows, mockState.periodStartDate),
  };
  return mockState;
}

export async function fetchTransportChargeState(): Promise<TransportChargeState> {
  if (useMock) {
    return recalcMockState();
  }
  const { data } = await api.get<TransportChargeState>("/api/transportChargeState");
  return data;
}

export async function updateTransportPeriodStartDate(
  periodStartDate: string,
): Promise<TransportChargeState> {
  if (useMock) {
    mockState = { ...mockState, periodStartDate };
    return recalcMockState();
  }
  const { data } = await api.put<TransportChargeState>("/api/transportChargeState", {
    periodStartDate,
  });
  return data;
}
