import type { Request, Response } from 'express';
import { operationsSummaryService } from '../services/operationsSummaryService';
import { asyncHandler } from '../utils/asyncHandler';
import { getCurrentSeasonYear, parseSeasonQuery } from '../utils/seasonRange';

export const operationsSummaryController = {
  operations: asyncHandler(async (req: Request, res: Response) => {
    const seasonYear = parseSeasonQuery(req.query) ?? getCurrentSeasonYear();
    const rows = await operationsSummaryService.getOperationsSummary(seasonYear);
    res.json({ rows, season: seasonYear });
  }),
};
