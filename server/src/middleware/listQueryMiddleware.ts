import type { NextFunction, Request, Response } from 'express'
import { parseListQueryFromParams } from '../utils/listQuery'

export function parseListQuery(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const allowExport =
    String(req.query.export ?? '') === '1' ||
    String(req.query.export ?? '') === 'true'
  req.listQuery = parseListQueryFromParams(
    req.query as Record<string, unknown>,
    { allowExportPageSize: allowExport },
  )
  next()
}
