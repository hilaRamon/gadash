import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query'
import { listCollection } from "@/lib/collectionApi"
import { collectionKeys } from "@/lib/queryKeys"
import type {
  ListCollectionParams,
  PaginatedResult,
} from "@/lib/listCollectionParams"
import type { CollectionDocument } from "@/schema/types"

type PaginatedParams = ListCollectionParams & {
  page: number
  pageSize?: number
}

type UseCollectionListOptions = {
  enabled?: boolean
}

export function useCollectionList(
  collection: string,
  params: PaginatedParams,
  options?: UseCollectionListOptions,
): UseQueryResult<PaginatedResult<CollectionDocument>>

export function useCollectionList(
  collection: string,
  params?: ListCollectionParams,
  options?: UseCollectionListOptions,
): UseQueryResult<CollectionDocument[]>

export function useCollectionList(
  collection: string,
  params?: ListCollectionParams,
  options?: UseCollectionListOptions,
): UseQueryResult<
  CollectionDocument[] | PaginatedResult<CollectionDocument>
> {
  return useQuery({
    queryKey: collectionKeys.list(collection, params),
    queryFn: () => listCollection(collection, params),
    placeholderData: params?.page != null ? keepPreviousData : undefined,
    enabled: options?.enabled ?? true,
  })
}
