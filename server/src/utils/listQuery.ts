export type SortDirection = 'asc' | 'desc'

export type ListSort = {
  field: string
  direction: SortDirection
}

export type ListFilter = {
  field: string
  operator: string
  value: string
}

export type ListQuery = {
  /** Absent = return full array (dropdowns / legacy callers). */
  page?: number
  pageSize: number
  sort?: ListSort
  season?: number
  search?: string
  q?: Record<string, string>
  filter?: ListFilter
  /** Operations tracking page tabs: fieldWork | admin | excludeFuel */
  operationScope?: 'fieldWork' | 'admin' | 'excludeFuel'
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 200
export const MAX_EXPORT_PAGE_SIZE = 10_000

function parsePositiveInt(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return undefined
  return Math.floor(n)
}

function parseSort(raw: unknown): ListSort | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined
  const [field, directionRaw] = raw.split(':')
  if (!field?.trim()) return undefined
  const direction: SortDirection =
    directionRaw === 'desc' ? 'desc' : 'asc'
  return { field: field.trim(), direction }
}

function parseFilter(raw: unknown): ListFilter | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined
  const parts = raw.split(':')
  if (parts.length < 3) return undefined
  const [field, operator, ...valueParts] = parts
  if (!field?.trim() || !operator?.trim()) return undefined
  return {
    field: field.trim(),
    operator: operator.trim(),
    value: valueParts.join(':'),
  }
}

function parseColumnSearch(query: Record<string, unknown>): Record<string, string> | undefined {
  const q: Record<string, string> = {}

  const nested = query.q
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    for (const [key, value] of Object.entries(nested as Record<string, unknown>)) {
      const str = String(value ?? '').trim()
      if (key && str) q[key] = str
    }
  }

  for (const [key, value] of Object.entries(query)) {
    if (!key.startsWith('q[') || !key.endsWith(']')) continue
    const field = key.slice(2, -1).trim()
    const str = String(value ?? '').trim()
    if (field && str) q[field] = str
  }

  return Object.keys(q).length > 0 ? q : undefined
}

function parseOperationScope(raw: unknown): ListQuery['operationScope'] | undefined {
  const value = String(raw ?? '').trim()
  if (value === 'fieldWork' || value === 'admin' || value === 'excludeFuel') {
    return value
  }
  return undefined
}

export function parseListQueryFromParams(
  query: Record<string, unknown>,
  options?: { allowExportPageSize?: boolean },
): ListQuery {
  const page = parsePositiveInt(query.page)
  const rawPageSize = parsePositiveInt(query.pageSize)
  const maxSize = options?.allowExportPageSize
    ? MAX_EXPORT_PAGE_SIZE
    : MAX_PAGE_SIZE
  const pageSize = Math.min(rawPageSize ?? DEFAULT_PAGE_SIZE, maxSize)

  const search =
    typeof query.search === 'string' && query.search.trim()
      ? query.search.trim()
      : undefined

  const seasonRaw = String(query.season ?? '').trim()
  const season =
    /^20\d{2}$/.test(seasonRaw) ? Number(seasonRaw) : undefined

  return {
    page,
    pageSize,
    sort: parseSort(query.sort),
    season,
    search,
    q: parseColumnSearch(query),
    filter: parseFilter(query.filter),
    operationScope: parseOperationScope(query.operationScope),
  }
}

export function toMongoSort(
  sort: ListSort | undefined,
  fieldMap: Record<string, string>,
  defaultSort: Record<string, 1 | -1>,
): Record<string, 1 | -1> {
  if (!sort) return defaultSort
  const path = fieldMap[sort.field] ?? sort.field
  if (!path || path.includes('.')) {
    // Nested/populated sort fields need special handling; fall back to default
    if (!fieldMap[sort.field]) return defaultSort
  }
  const mapped = fieldMap[sort.field]
  if (!mapped) return defaultSort
  return { [mapped]: sort.direction === 'desc' ? -1 : 1 }
}
