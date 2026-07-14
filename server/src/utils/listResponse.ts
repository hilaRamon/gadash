import type { Request, Response } from 'express'
import type { ListQuery, PaginatedResult } from './listQuery'

export async function respondToListRequest<T>(
  req: Request,
  res: Response,
  fetchAll: () => Promise<T[]>,
  fetchPaginated: (listQuery: ListQuery) => Promise<PaginatedResult<T>>,
): Promise<void> {
  const listQuery = req.listQuery
  if (listQuery?.page == null) {
    res.json(await fetchAll())
    return
  }
  res.json(await fetchPaginated(listQuery))
}
