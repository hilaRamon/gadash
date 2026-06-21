import type { Request, Response } from 'express';
import { monthlyReportService } from '../services/monthlyReportService';
import { asyncHandler } from '../utils/asyncHandler';

export const monthlyReportController = {
  summary: asyncHandler(async (req: Request, res: Response) => {
    const month = String(req.query.month ?? '');
    const data = await monthlyReportService.getMonthSummary(month);
    res.json({ rows: data });
  }),

  employeeReport: asyncHandler(async (req: Request, res: Response) => {
    const data = await monthlyReportService.getEmployeeReport(
      req.params.employeeId,
      req.params.month,
    );
    res.json(data);
  }),

  updateAbsence: asyncHandler(async (req: Request, res: Response) => {
    const data = await monthlyReportService.updateAbsenceDays(
      req.params.employeeId,
      req.params.month,
      req.body ?? {},
    );
    res.json(data);
  }),

  close: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = String(req.body?.employeeId ?? '');
    const month = String(req.body?.month ?? '');
    const data = await monthlyReportService.closeMonth(employeeId, month);
    res.json(data);
  }),

  closeAll: asyncHandler(async (req: Request, res: Response) => {
    const month = String(req.body?.month ?? '');
    const data = await monthlyReportService.closeAllMonths(month);
    res.json(data);
  }),
};
