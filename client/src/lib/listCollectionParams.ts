export type ListCollectionParams = {
  season?: number
  page?: number
  pageSize?: number
  sort?: string
  search?: string
  q?: Record<string, string>
  filter?: string
  operationScope?: 'fieldWork' | 'admin' | 'excludeFuel'
  /** Request a high pageSize ceiling for Excel export of filtered rows */
  export?: boolean
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export function isPaginatedResult<T>(
  data: T[] | PaginatedResult<T>,
): data is PaginatedResult<T> {
  return (
    data != null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Array.isArray((data as PaginatedResult<T>).items) &&
    typeof (data as PaginatedResult<T>).total === 'number'
  )
}

export function buildListQueryString(params?: ListCollectionParams): string {
  if (!params) return ''
  const searchParams = new URLSearchParams()

  if (params.season != null) searchParams.set('season', String(params.season))
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.pageSize != null) {
    searchParams.set('pageSize', String(params.pageSize))
  }
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.search?.trim()) searchParams.set('search', params.search.trim())
  if (params.filter) searchParams.set('filter', params.filter)
  if (params.operationScope) {
    searchParams.set('operationScope', params.operationScope)
  }
  if (params.export) searchParams.set('export', '1')

  if (params.q) {
    for (const [key, value] of Object.entries(params.q)) {
      if (value?.trim()) searchParams.set(`q[${key}]`, value.trim())
    }
  }

  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}
