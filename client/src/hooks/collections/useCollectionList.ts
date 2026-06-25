import { useQuery } from '@tanstack/react-query'
import { listCollection } from '../../lib/collectionApi'
import { collectionKeys } from '../../lib/queryKeys'
import type { ListCollectionParams } from '../../lib/listCollectionParams'

export function useCollectionList(
  collection: string,
  params?: ListCollectionParams,
) {
  return useQuery({
    queryKey: collectionKeys.list(collection, params),
    queryFn: () => listCollection(collection, params),
  })
}
