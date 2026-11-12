import type { Request, Response } from 'express';
import { operationsSummaryService } from '../services/operationsSummaryService';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { assertValidMonth } from '../utils/monthRange';
import { getCurrentSeasonYear, parseSeasonQuery } from '../utils/seasonRange';

function parseOptionalMonth(value: unknown): string | undefined {
  if (value == null || String(value).trim() === '') return undefined;
  try {
    return assertValidMonth(value);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'חודש לא תקין (YYYY-MM)';
    throw new HttpError(400, message);
  }
}

export const operationsSummaryController = {
  operations: asyncHandler(async (req: Request, res: Response) => {
    const seasonYear = parseSeasonQuery(req.query) ?? getCurrentSeasonYear();
    const month = parseOptionalMonth(req.query.month);
    const rows = await operationsSummaryService.getOperationsSummary(
      seasonYear,
      month,
    );
    res.json({ rows, season: seasonYear, month: month ?? null });
  }),
};
