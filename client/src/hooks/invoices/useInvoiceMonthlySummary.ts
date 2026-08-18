import { useQuery } from "@tanstack/react-query";
import { fetchInvoiceMonthlySummary } from "@/lib/invoiceMonthlySummaryApi";
import { invoiceKeys } from "@/lib/queryKeys";

export function useInvoiceMonthlySummary(month: string) {
  return useQuery({
    queryKey: invoiceKeys.monthlySummary(month),
    queryFn: () => fetchInvoiceMonthlySummary(month),
    enabled: Boolean(month),
  });
}
