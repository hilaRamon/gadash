import { useQuery } from '@tanstack/react-query'
import { listCollection } from '../../lib/collectionApi'
import { collectionKeys } from '../../lib/queryKeys'
import type { TableQueryParams } from '../../schema/tableQuery'

export function useCollectionList(
  collection: string,
  params?: TableQueryParams,
) {
  return useQuery({
    queryKey: collectionKeys.list(collection, params),
    queryFn: () => listCollection(collection, params),
  })
}
