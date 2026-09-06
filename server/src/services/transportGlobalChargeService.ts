import mongoose, { Types } from 'mongoose';
import { GLOBAL_TRANSPORT_CHARGE_ALREADY_BILLED_ERROR } from '../lib/customerBillingErrors';
import { transportGlobalAllocationRepository } from '../repositories/transportGlobalAllocationRepository';
import { transportGlobalChargeRepository } from '../repositories/transportGlobalChargeRepository';
import { transportTrackingRepository } from '../repositories/transportTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import {
  transportGlobalChargeToApiDocument,
  transportGlobalChargeToApiDocuments,
} from '../utils/transportGlobalChargeApiMapper';
import {
  findSeasonPlotsForGlobalCharge,
  type SeasonPlotRow,
} from '../utils/seasonPlotDiscovery';

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function roundPricePerDunam(value: number): number {
  return Number(value.toFixed(3));
}

export type GlobalTransportChargePreviewCustomer = {
  customerName: string;
  dunam: number;
  price: number;
};

export type GlobalTransportChargePreview = {
  seasonYear: number;
  transportTotal: number;
  transportRowCount: number;
  totalDunam: number;
  pricePerDunam: number;
  plotCount: number;
  customerCount: number;
  customers: GlobalTransportChargePreviewCustomer[];
};

export type GlobalTransportChargeResult = GlobalTransportChargePreview & {
  globalChargeId: string;
  allocationsCreated: number;
};

export type GlobalTransportAllocationDetail = {
  _id: string;
  customer: string;
  customerName: string;
  dunam: number;
  pricePerDunam: number;
  finalPrice: number;
  wasCharged: boolean;
};

export type GlobalTransportChargeDetail = ApiDocument & {
  allocations: GlobalTransportAllocationDetail[];
};

function toObjectIdArray(value: unknown): Types.ObjectId[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').trim())
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
}

type CustomerPlotGroup = {
  customerId: Types.ObjectId;
  customerName: string;
  plots: SeasonPlotRow[];
};

function sumTransportTotal(
  rows: { finalPrice?: number | null }[],
): number {
  const sum = rows.reduce((acc, row) => acc + Number(row.finalPrice ?? 0), 0);
  return roundMoney(sum);
}

function allocatePlotLinePrices(
  plots: SeasonPlotRow[],
  transportTotal: number,
  pricePerDunam: number,
): Map<string, number> {
  const sorted = [...plots].sort((a, b) =>
    String(a._id).localeCompare(String(b._id)),
  );
  const prices = new Map<string, number>();
  let allocated = 0;

  for (let index = 0; index < sorted.length; index += 1) {
    const plot = sorted[index];
    const isLast = index === sorted.length - 1;
    const linePrice = isLast
      ? roundMoney(transportTotal - allocated)
      : roundMoney(pricePerDunam * plot.dunam);
    prices.set(String(plot._id), linePrice);
    allocated += linePrice;
  }

  return prices;
}

function groupPlotsByCustomer(plots: SeasonPlotRow[]): CustomerPlotGroup[] {
  const groups = new Map<string, CustomerPlotGroup>();

  for (const plot of plots) {
    const customerId = String(plot.customer);
    const existing = groups.get(customerId);
    if (existing) {
      existing.plots.push(plot);
      continue;
    }
    groups.set(customerId, {
      customerId: plot.customer,
      customerName: plot.customerName,
      plots: [plot],
    });
  }

  return [...groups.values()].sort((a, b) =>
    a.customerName.localeCompare(b.customerName, 'he'),
  );
}

async function computeChargeData(
  seasonYear: number,
  session?: unknown,
): Promise<{
  transportRows: { _id: Types.ObjectId; finalPrice?: number | null }[];
  transportTotal: number;
  plots: SeasonPlotRow[];
  totalDunam: number;
  pricePerDunam: number;
  customerGroups: CustomerPlotGroup[];
  plotLinePrices: Map<string, number>;
}> {
  const [transportRows, plots] = await Promise.all([
    transportTrackingRepository.findUnchargedGlobalInSeason(seasonYear, session),
    findSeasonPlotsForGlobalCharge(seasonYear),
  ]);

  const transportTotal = sumTransportTotal(transportRows);
  if (transportTotal <= 0) {
    throw new Error('אין הובלות גלובליות לחיוב בעונה');
  }

  const totalDunam = plots.reduce((sum, plot) => sum + Number(plot.dunam ?? 0), 0);
  if (totalDunam <= 0) {
    throw new Error('אין דונמים לחלוקה');
  }

  const pricePerDunam = roundPricePerDunam(transportTotal / totalDunam);
  const plotLinePrices = allocatePlotLinePrices(plots, transportTotal, pricePerDunam);
  const customerGroups = groupPlotsByCustomer(plots);

  return {
    transportRows,
    transportTotal,
    plots,
    totalDunam,
    pricePerDunam,
    customerGroups,
    plotLinePrices,
  };
}

function buildPreviewFromData(
  seasonYear: number,
  data: Awaited<ReturnType<typeof computeChargeData>>,
): GlobalTransportChargePreview {
  const customers = data.customerGroups.map((group) => ({
    customerName: group.customerName,
    dunam: group.plots.reduce((sum, plot) => sum + Number(plot.dunam ?? 0), 0),
    price: roundMoney(
      group.plots.reduce(
        (sum, plot) => sum + (data.plotLinePrices.get(String(plot._id)) ?? 0),
        0,
      ),
    ),
  }));

  return {
    seasonYear,
    transportTotal: data.transportTotal,
    transportRowCount: data.transportRows.length,
    totalDunam: data.totalDunam,
    pricePerDunam: data.pricePerDunam,
    plotCount: data.plots.length,
    customerCount: data.customerGroups.length,
    customers,
  };
}

function toCustomerParts(value: unknown): { id: string; name: string } {
  if (value != null && typeof value === 'object' && '_id' in value) {
    const ref = value as { _id?: unknown; name?: unknown };
    return {
      id: String(ref._id ?? ''),
      name: String(ref.name ?? ''),
    };
  }
  return { id: value == null ? '' : String(value), name: '' };
}

async function billsCountByChargeIds(
  rows: { _id?: unknown }[],
): Promise<Map<string, number>> {
  const chargeIds = rows
    .map((row) => String(row._id ?? ''))
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
  return transportGlobalAllocationRepository.countChargedByChargeIds(chargeIds);
}

export const transportGlobalChargeService = {
  async list(seasonYear?: number): Promise<ApiDocument[]> {
    const rows = await transportGlobalChargeRepository.findAll(seasonYear);
    const counts = await billsCountByChargeIds(rows);
    return transportGlobalChargeToApiDocuments(
      rows as Record<string, unknown>[],
      counts,
    );
  },

  async listPaginated(listQuery: import('../utils/listQuery').ListQuery) {
    const result = await transportGlobalChargeRepository.findPaginated(listQuery);
    const counts = await billsCountByChargeIds(result.items);
    return {
      ...result,
      items: transportGlobalChargeToApiDocuments(
        result.items as Record<string, unknown>[],
        counts,
      ),
    };
  },

  async getById(id: string): Promise<GlobalTransportChargeDetail> {
    const row = await transportGlobalChargeRepository.findById(id);
    if (!row) {
      throw new Error('לא נמצא');
    }

    const allocations = await transportGlobalAllocationRepository.findByChargeId(
      id,
    );
    const chargedCount = allocations.filter(
      (allocation) => allocation.wasCharged === true,
    ).length;
    const pricePerDunam = Number(row.pricePerDunam ?? 0);
    const batch = transportGlobalChargeToApiDocument(
      row as Record<string, unknown>,
      chargedCount,
    );

    return {
      ...batch,
      allocations: allocations.map((allocation) => {
        const customer = toCustomerParts(allocation.customer);
        return {
          _id: String(allocation._id),
          customer: customer.id,
          customerName: customer.name,
          dunam: Number(allocation.dunam ?? 0),
          pricePerDunam,
          finalPrice: Number(allocation.finalPrice ?? 0),
          wasCharged: allocation.wasCharged === true,
        };
      }),
    };
  },

  async cancel(id: string): Promise<void> {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const batch = await transportGlobalChargeRepository.findById(id);
        if (!batch) {
          throw new Error('לא נמצא');
        }

        const allocations =
          await transportGlobalAllocationRepository.findByChargeId(id, session);
        if (allocations.some((allocation) => allocation.wasCharged === true)) {
          throw new Error(GLOBAL_TRANSPORT_CHARGE_ALREADY_BILLED_ERROR);
        }

        await transportGlobalAllocationRepository.deleteByChargeId(id, session);

        const transportIds = toObjectIdArray(batch.transportTrackingIds);
        await transportTrackingRepository.markUncharged(transportIds, session);

        await transportGlobalChargeRepository.deleteById(id, session);
      });
    } finally {
      await session.endSession();
    }
  },

  async preview(seasonYear: number): Promise<GlobalTransportChargePreview> {
    const data = await computeChargeData(seasonYear);
    return buildPreviewFromData(seasonYear, data);
  },

  async execute(seasonYear: number): Promise<GlobalTransportChargeResult> {
    const session = await mongoose.startSession();
    try {
      let globalChargeId = '';
      let resolvedPreview: GlobalTransportChargePreview | undefined;
      let allocationsCreated = 0;

      await session.withTransaction(async () => {
        const data = await computeChargeData(seasonYear, session);
        resolvedPreview = buildPreviewFromData(seasonYear, data);

        const transportTrackingIds = data.transportRows.map((row) =>
          new Types.ObjectId(String(row._id)),
        );
        const executedAt = new Date();

        const [batch] = await transportGlobalChargeRepository.create(
          {
            seasonYear,
            executedAt,
            transportTotal: data.transportTotal,
            totalDunam: data.totalDunam,
            pricePerDunam: data.pricePerDunam,
            transportTrackingIds,
            customerBillingIds: [],
          },
          session,
        );

        globalChargeId = String(batch._id);

        const allocations = data.customerGroups.map((group) => ({
          globalTransportChargeId: batch._id as Types.ObjectId,
          customer: group.customerId,
          dunam: group.plots.reduce(
            (sum, plot) => sum + Number(plot.dunam ?? 0),
            0,
          ),
          finalPrice: roundMoney(
            group.plots.reduce(
              (sum, plot) =>
                sum + (data.plotLinePrices.get(String(plot._id)) ?? 0),
              0,
            ),
          ),
          wasCharged: false,
        }));

        await transportGlobalAllocationRepository.createMany(
          allocations,
          session,
        );
        allocationsCreated = allocations.length;

        await transportTrackingRepository.markCharged(transportTrackingIds, session);
      });

      if (resolvedPreview == null) {
        throw new Error('ביצוע החיוב נכשל');
      }

      return {
        ...resolvedPreview,
        globalChargeId,
        allocationsCreated,
      };
    } finally {
      await session.endSession();
    }
  },
};
