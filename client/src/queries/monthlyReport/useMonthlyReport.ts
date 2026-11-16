import { useQuery } from "@tanstack/react-query";
import {
  fetchEmployeeMonthlyReport,
  fetchMonthlySummary,
} from "@/api/monthlyReportApi";
import { monthlyReportKeys } from "@/queries/queryKeys";

export function useEmployeeMonthlyReport(employeeId: string, month: string) {
  return useQuery({
    queryKey: monthlyReportKeys.employee(employeeId, month),
    queryFn: () => fetchEmployeeMonthlyReport(employeeId, month),
    enabled: Boolean(employeeId && month),
  });
}

export function useMonthlySummary(month: string) {
  return useQuery({
    queryKey: monthlyReportKeys.summary(month),
    queryFn: () => fetchMonthlySummary(month),
    enabled: Boolean(month),
  });
}
