import api from "./api";

export type InvoiceMonthlySummary = {
  month: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
};

export async function fetchInvoiceMonthlySummary(
  month: string,
): Promise<InvoiceMonthlySummary> {
  const { data } = await api.get<InvoiceMonthlySummary>(
    "/api/invoices/monthly-summary",
    { params: { month } },
  );
  return data;
}
