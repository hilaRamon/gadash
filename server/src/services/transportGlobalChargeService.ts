import mongoose, { Types } from 'mongoose';
import {
  CustomerBillingTrackingModel,
  type CustomerBillingStatus,
} from '../models/CustomerBillingTracking';
import { transportGlobalChargeRepository } from '../repositories/transportGlobalChargeRepository';
import { transportTrackingRepository } from '../repositories/transportTrackingRepository';
import type { ApiDocument } from '../types/apiDocument';
import type { CustomerBillDocument } from '../types/customerBill';
import { PAID_BILLING_DELETE_ERROR } from '../lib/customerBillingErrors';
import {
  buildGlobalTransportBillDocument,
  type GlobalTransportPlotLine,
} from '../utils/customerBillDataBuilder';
import {
  transportGlobalChargeToApiDocument,
  transportGlobalChargeToApiDocuments,
} from '../utils/transportGlobalChargeApiMapper';
import { customerBillingTrackingToApiDocument } from '../utils/customerBillingTrackingApiMapper';
import {
  findSeasonPlotsWithWork,
  type SeasonPlotRow,
} from '../utils/seasonPlotDiscovery';

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function roundPricePerDunam(value: number): number {
  return Number(value.toFixed(3));
}

export type GlobalTransportChargePreview = {
  seasonYear: number;
  transportTotal: number;
  transportRowCount: number;
  totalDunam: number;
  pricePerDunam: number;
  plotCount: number;
  customerCount: number;
};

export type GlobalTransportChargeResult = GlobalTransportChargePreview & {
  globalChargeId: string;
  billsCreated: number;
  customerBillingIds: string[];
};

export type GlobalTransportChargeDetail = ApiDocument & {
  customerBillings: ApiDocument[];
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
    findSeasonPlotsWithWork(seasonYear),
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
  return {
    seasonYear,
    transportTotal: data.transportTotal,
    transportRowCount: data.transportRows.length,
    totalDunam: data.totalDunam,
    pricePerDunam: data.pricePerDunam,
    plotCount: data.plots.length,
    customerCount: data.customerGroups.length,
  };
}

export const transportGlobalChargeService = {
  async list(seasonYear?: number): Promise<ApiDocument[]> {
    const rows = await transportGlobalChargeRepository.findAll(seasonYear);
    return transportGlobalChargeToApiDocuments(rows as Record<string, unknown>[]);
  },

  async getById(id: string): Promise<GlobalTransportChargeDetail> {
    const row = await transportGlobalChargeRepository.findById(id);
    if (!row) {
      throw new Error('לא נמצא');
    }

    const billingIds = toObjectIdArray(row.customerBillingIds);
    const billings =
      billingIds.length === 0
        ? []
        : await CustomerBillingTrackingModel.find({ _id: { $in: billingIds } })
            .populate({ path: 'customer', select: '_id name' })
            .lean();

    const batch = transportGlobalChargeToApiDocument(row as Record<string, unknown>);
    return {
      ...batch,
      customerBillings: billings.map((billing) =>
        customerBillingTrackingToApiDocument(billing as Record<string, unknown>),
      ),
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

        const billingIds = toObjectIdArray(batch.customerBillingIds);
        if (billingIds.length > 0) {
          const billings = await CustomerBillingTrackingModel.find({
            _id: { $in: billingIds },
          })
            .session(session)
            .lean();

          if (billings.some((billing) => billing.paid === true)) {
            throw new Error(PAID_BILLING_DELETE_ERROR);
          }

          await CustomerBillingTrackingModel.deleteMany(
            { _id: { $in: billingIds } },
            { session },
          );
        }

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
      const customerBillingIds: Types.ObjectId[] = [];

      await session.withTransaction(async () => {
        const data = await computeChargeData(seasonYear, session);
        resolvedPreview = buildPreviewFromData(seasonYear, data);

        const transportTrackingIds = data.transportRows.map((row) =>
          new Types.ObjectId(String(row._id)),
        );
        const executedAt = new Date();
        const billDate = executedAt.toLocaleDateString('he-IL');

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

        for (const group of data.customerGroups) {
          const plotLines: GlobalTransportPlotLine[] = group.plots.map((plot) => ({
            plotName: plot.name,
            dunam: plot.dunam,
            linePrice: data.plotLinePrices.get(String(plot._id)) ?? 0,
          }));

          const storedBillDocument: CustomerBillDocument =
            buildGlobalTransportBillDocument({
              customerName: group.customerName,
              billDate,
              pricePerDunam: data.pricePerDunam,
              plotLines,
            });

          const [billing] = await CustomerBillingTrackingModel.create(
            [
              {
                date: executedAt,
                customer: group.customerId,
                billKind: 'globalTransport',
                globalTransportChargeId: batch._id,
                storedBillDocument,
                notes: '',
                status: 'לא אושר כלל' satisfies CustomerBillingStatus,
                paid: false,
                finalPrice: storedBillDocument.total,
                operationsTrackingIds: [],
                materialUsageTrackingIds: [],
                contractorTrackingIds: [],
                baleOrderTrackingIds: [],
                transportTrackingIds: [],
              },
            ],
            { session },
          );

          customerBillingIds.push(billing._id as Types.ObjectId);
        }

        await transportGlobalChargeRepository.updateCustomerBillingIds(
          batch._id as Types.ObjectId,
          customerBillingIds,
          session,
        );

        await transportTrackingRepository.markCharged(transportTrackingIds, session);
      });

      if (resolvedPreview == null) {
        throw new Error('ביצוע החיוב נכשל');
      }

      return {
        ...resolvedPreview,
        globalChargeId,
        billsCreated: customerBillingIds.length,
        customerBillingIds: customerBillingIds.map(String),
      };
    } finally {
      await session.endSession();
    }
  },
};
