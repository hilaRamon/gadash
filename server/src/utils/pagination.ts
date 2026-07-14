import type { ListSort, PaginatedResult } from './listQuery'

export type PopulateSpec =
  | string
  | {
      path: string
      select?: string
      populate?: PopulateSpec | PopulateSpec[]
    }

export type PaginateOptions = {
  page: number
  pageSize: number
  sort: Record<string, 1 | -1>
  populate?: PopulateSpec | PopulateSpec[]
}

export async function paginateModel<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  filter: Record<string, unknown>,
  options: PaginateOptions,
): Promise<PaginatedResult<T>> {
  const { page, pageSize, sort, populate } = options
  const skip = (page - 1) * pageSize

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let findQuery: any = model
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(pageSize)
    .lean()
  if (populate) {
    findQuery = findQuery.populate(populate)
  }

  const [items, total] = await Promise.all([
    findQuery.exec() as Promise<T[]>,
    model.countDocuments(filter) as Promise<number>,
  ])

  return {
    items,
    total,
    page,
    pageSize,
  }
}

export function sortFromListSort(
  sort: ListSort | undefined,
  allowed: Record<string, string>,
  fallback: Record<string, 1 | -1>,
): Record<string, 1 | -1> {
  if (!sort) return fallback
  const path = allowed[sort.field]
  if (!path) return fallback
  return { [path]: sort.direction === 'desc' ? -1 : 1 }
}
