import api from './api';

export type OperationsSummaryRow = {
  operationId: string;
  operationName: string;
  pricingForm: 'דונם' | 'שעתי' | 'כמות יחידות' | null;
  currentCost: number | null;
  totalAmount: number;
  amountUnit: 'דונם' | 'שעות' | 'יחידות';
  totalCharge: number;
};

export async function fetchOperationsSummary(
  season: number,
  month?: string,
): Promise<OperationsSummaryRow[]> {
  const { data } = await api.get<{ rows: OperationsSummaryRow[] }>(
    '/api/summaries/operations',
    { params: { season, ...(month ? { month } : {}) } },
  );
  return data.rows;
}
