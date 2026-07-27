import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateMonthlyHoursFromTrackings,
  mergeDayIntervalsHours,
} from './monthlyHoursCalculation';

const day = new Date('2026-07-15T00:00:00.000Z');

describe('mergeDayIntervalsHours', () => {
  it('counts identical intervals once', () => {
    const hours = mergeDayIntervalsHours([
      { start: 6 * 60, end: 12 * 60 },
      { start: 6 * 60, end: 12 * 60 },
      { start: 6 * 60, end: 12 * 60 },
    ]);
    assert.equal(hours, 6);
  });

  it('merges overlapping intervals', () => {
    const hours = mergeDayIntervalsHours([
      { start: 6 * 60, end: 10 * 60 },
      { start: 8 * 60, end: 12 * 60 },
    ]);
    assert.equal(hours, 6);
  });

  it('merges adjacent intervals', () => {
    const hours = mergeDayIntervalsHours([
      { start: 6 * 60, end: 9 * 60 },
      { start: 9 * 60, end: 12 * 60 },
    ]);
    assert.equal(hours, 6);
  });

  it('sums sequential non-overlapping gaps correctly', () => {
    const hours = mergeDayIntervalsHours([
      { start: 6 * 60, end: 8 * 60 },
      { start: 10 * 60, end: 12 * 60 },
    ]);
    assert.equal(hours, 4);
  });
});

describe('calculateMonthlyHoursFromTrackings', () => {
  it('does not multiply hours across identical multi-plot rows', () => {
    const result = calculateMonthlyHoursFromTrackings([
      { date: day, startTime: '06:00', endTime: '12:00' },
      { date: day, startTime: '06:00', endTime: '12:00' },
      { date: day, startTime: '06:00', endTime: '12:00' },
    ]);

    assert.equal(result.totalHours, 6);
    assert.equal(result.totalDaysWorked, 1);
    assert.equal(result.days[0]?.totalHours, 6);
  });

  it('merges overlapping and sequential intervals for one day', () => {
    const result = calculateMonthlyHoursFromTrackings([
      { date: day, startTime: '06:00', endTime: '09:00' },
      { date: day, startTime: '08:00', endTime: '10:00' },
      { date: day, startTime: '10:00', endTime: '12:00' },
    ]);

    assert.equal(result.totalHours, 6);
  });

  it('keeps separate days independent', () => {
    const result = calculateMonthlyHoursFromTrackings([
      { date: new Date('2026-07-15T00:00:00.000Z'), startTime: '06:00', endTime: '12:00' },
      { date: new Date('2026-07-16T00:00:00.000Z'), startTime: '06:00', endTime: '12:00' },
    ]);

    assert.equal(result.totalHours, 12);
    assert.equal(result.totalDaysWorked, 2);
  });
});
