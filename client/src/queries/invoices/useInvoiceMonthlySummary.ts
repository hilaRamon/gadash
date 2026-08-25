import { useQuery } from "@tanstack/react-query";
import { fetchInvoiceMonthlySummary } from "@/api/invoiceApi";
import { invoiceKeys } from "@/queries/queryKeys";

export function useInvoiceMonthlySummary(month: string) {
  return useQuery({
    queryKey: invoiceKeys.monthlySummary(month),
    queryFn: () => fetchInvoiceMonthlySummary(month),
    enabled: Boolean(month),
  });
}
