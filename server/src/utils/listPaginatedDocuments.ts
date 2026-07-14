import type { PopulateSpec } from './pagination'
import { getCollectionListConfig } from './collectionListConfig'
import type { ListQuery, PaginatedResult } from './listQuery'
import { buildMongoListFilter } from './mongoListFilter'
import { paginateModel, sortFromListSort } from './pagination'
import {
  findOperationIdsByType,
  resolveRefIds,
} from './refIdResolver'
import {
  buildSeasonDateQuery,
  collectionHasDateField,
} from './seasonRange'

export async function buildSeasonAndScopeFilter(
  collection: string,
  listQuery: ListQuery,
): Promise<Record<string, unknown>> {
  const extra: Record<string, unknown> = {}

  if (listQuery.season != null) {
    if (collection === 'transportGlobalCharges') {
      extra.seasonYear = listQuery.season
    } else if (collectionHasDateField(collection)) {
      Object.assign(extra, buildSeasonDateQuery(listQuery.season))
    }
    // Master data collections have no season field — ignore season param
  }

  if (collection === 'operationsTrackings' && listQuery.operationScope) {
    if (listQuery.operationScope === 'fieldWork') {
      const ids = await findOperationIdsByType(['עיבוד'])
      extra.operation = { $in: ids }
    } else if (listQuery.operationScope === 'admin') {
      const ids = await findOperationIdsByType(['מנהלה'])
      extra.operation = { $in: ids }
    } else if (listQuery.operationScope === 'excludeFuel') {
      const ids = await findOperationIdsByType({ $ne: 'דלק' })
      extra.operation = { $in: ids }
    }
  }

  return extra
}

export async function listPaginatedDocuments<T = Record<string, unknown>>(
  collection: string,
  // mongoose Model generics are too strict across schema options; keep loose
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  listQuery: ListQuery,
  populate?: PopulateSpec | PopulateSpec[],
): Promise<PaginatedResult<T>> {
  const config = getCollectionListConfig(collection)
  if (!config) {
    throw new Error(`No list config for collection: ${collection}`)
  }

  const extraFilter = await buildSeasonAndScopeFilter(collection, listQuery)
  const filter = await buildMongoListFilter(
    config,
    listQuery,
    resolveRefIds,
    extraFilter,
  )
  const sort = sortFromListSort(
    listQuery.sort,
    config.sortFields,
    config.defaultSort,
  )

  return paginateModel<T>(model, filter, {
    page: listQuery.page ?? 1,
    pageSize: listQuery.pageSize,
    sort,
    populate,
  })
}
