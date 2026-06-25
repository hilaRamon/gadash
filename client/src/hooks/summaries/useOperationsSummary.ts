import { useQuery } from '@tanstack/react-query';
import { fetchOperationsSummary } from '../../lib/operationsSummaryApi';
import { summaryKeys } from '../../lib/queryKeys';

export function useOperationsSummary(season: number) {
  return useQuery({
    queryKey: summaryKeys.operations(season),
    queryFn: () => fetchOperationsSummary(season),
    enabled: Boolean(season),
  });
}
