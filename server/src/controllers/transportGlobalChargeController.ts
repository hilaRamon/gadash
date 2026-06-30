import type { Request, Response } from 'express';
import { transportGlobalChargeService } from '../services/transportGlobalChargeService';
import { asyncHandler } from '../utils/asyncHandler';
import { parseSeasonQuery } from '../utils/seasonRange';

function parseSeasonFromBody(body: Record<string, unknown>): number {
  const season =
    parseSeasonQuery({ season: body.season }) ??
    parseSeasonQuery({ season: body.seasonYear });
  if (season == null) {
    throw new Error('עונה לא תקינה');
  }
  return season;
}

export const transportGlobalChargeController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const seasonYear = parseSeasonQuery(req.query as Record<string, unknown>);
    const data = await transportGlobalChargeService.list(seasonYear);
    res.json(data);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await transportGlobalChargeService.getById(req.params.id);
    res.json(data);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    await transportGlobalChargeService.cancel(req.params.id);
    res.status(204).send();
  }),

  preview: asyncHandler(async (req: Request, res: Response) => {
    const seasonYear = parseSeasonQuery(req.query as Record<string, unknown>);
    if (seasonYear == null) {
      throw new Error('עונה לא תקינה');
    }
    const data = await transportGlobalChargeService.preview(seasonYear);
    res.json(data);
  }),

  execute: asyncHandler(async (req: Request, res: Response) => {
    const seasonYear = parseSeasonFromBody(req.body ?? {});
    const data = await transportGlobalChargeService.execute(seasonYear);
    res.status(201).json(data);
  }),
};
