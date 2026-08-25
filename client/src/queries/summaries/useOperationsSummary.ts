import { useQuery } from '@tanstack/react-query';
import { fetchOperationsSummary } from "@/api/operationsSummaryApi";
import { summaryKeys } from "@/queries/queryKeys";

export function useOperationsSummary(season: number) {
  return useQuery({
    queryKey: summaryKeys.operations(season),
    queryFn: () => fetchOperationsSummary(season),
    enabled: Boolean(season),
  });
}
