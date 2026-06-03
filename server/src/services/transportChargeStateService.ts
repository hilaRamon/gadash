import { TransportTrackingModel } from '../models/TransportTracking';
import { transportChargeStateRepository } from '../repositories/transportChargeStateRepository';
import {
  defaultPeriodStartDate,
  endOfDay,
  parsePeriodStartDate,
  startOfDay,
  toDateString,
} from '../utils/dateRange';

export type TransportChargeStateDto = {
  periodStartDate: string;
  totalSum: number;
};

function roundSum(value: number): number {
  return Number(value.toFixed(3));
}

export async function recalculateTotalSum(periodStartDate: Date): Promise<number> {
  const rangeStart = startOfDay(periodStartDate);
  const rangeEnd = endOfDay(new Date());

  const rows = await TransportTrackingModel.find({
    date: { $gte: rangeStart, $lte: rangeEnd },
  })
    .select('finalPrice')
    .lean();

  const sum = rows.reduce((acc, row) => acc + Number(row.finalPrice ?? 0), 0);
  return roundSum(sum);
}

function toDto(periodStartDate: Date, totalSum: number): TransportChargeStateDto {
  return {
    periodStartDate: toDateString(periodStartDate),
    totalSum: roundSum(totalSum),
  };
}

async function saveState(periodStartDate: Date, totalSum: number): Promise<TransportChargeStateDto> {
  const saved = await transportChargeStateRepository.upsert({
    periodStartDate: startOfDay(periodStartDate),
    totalSum: roundSum(totalSum),
  });
  if (!saved) {
    throw new Error('שמירת מצב חיוב נכשלה');
  }
  return toDto(saved.periodStartDate as Date, Number(saved.totalSum ?? 0));
}

export const transportChargeStateService = {
  async get(): Promise<TransportChargeStateDto> {
    const existing = await transportChargeStateRepository.findOne();
    if (!existing) {
      const periodStartDate = defaultPeriodStartDate();
      const totalSum = await recalculateTotalSum(periodStartDate);
      return saveState(periodStartDate, totalSum);
    }

    const periodStartDate = startOfDay(existing.periodStartDate as Date);
    return toDto(periodStartDate, Number(existing.totalSum ?? 0));
  },

  async updatePeriodStartDate(value: unknown): Promise<TransportChargeStateDto> {
    const periodStartDate = parsePeriodStartDate(value);
    const totalSum = await recalculateTotalSum(periodStartDate);
    return saveState(periodStartDate, totalSum);
  },

  async recalculateAndSave(): Promise<TransportChargeStateDto> {
    const existing = await transportChargeStateRepository.findOne();
    const periodStartDate = existing
      ? startOfDay(existing.periodStartDate as Date)
      : defaultPeriodStartDate();
    const totalSum = await recalculateTotalSum(periodStartDate);
    return saveState(periodStartDate, totalSum);
  },
};
