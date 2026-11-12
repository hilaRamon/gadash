import { useQuery } from '@tanstack/react-query';
import { fetchOperationsSummary } from "@/api/operationsSummaryApi";
import { summaryKeys } from "@/queries/queryKeys";

export function useOperationsSummary(season: number, month?: string) {
  return useQuery({
    queryKey: summaryKeys.operations(season, month),
    queryFn: () => fetchOperationsSummary(season, month),
    enabled: Boolean(season),
  });
}
