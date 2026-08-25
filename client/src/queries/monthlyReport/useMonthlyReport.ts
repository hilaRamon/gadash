import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchEmployeeMonthlyReport,
  fetchMonthlySummary,
  updateMonthlyAbsenceDays,
  type AbsenceDays,
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

export function useUpdateMonthlyAbsence(employeeId: string, month: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (absence: AbsenceDays) =>
      updateMonthlyAbsenceDays(employeeId, month, absence),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: monthlyReportKeys.employee(employeeId, month),
      });
      queryClient.invalidateQueries({
        queryKey: monthlyReportKeys.summary(month),
      });
    },
  });
}
