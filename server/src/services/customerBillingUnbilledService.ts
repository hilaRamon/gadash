/**
 * Server-side unbilled billing data for the create-billing flow.
 *
 * listCustomersWithUnbilled — customers that have at least one uncharged tracking row.
 * getUnbilledPreview — four enriched tracking arrays for one customer (same shape the client expects).
 * Rows are mapped through *ToApiDocuments helpers (finalPrice, names, etc.).
 */
import { Types } from 'mongoose';
import { BaleOrderTrackingModel } from '../models/BaleOrderTracking';
import { ContractorTrackingModel } from '../models/ContractorTracking';
import { CustomerModel } from '../models/Customer';
import { MaterialUsageTrackingModel } from '../models/MaterialUsageTracking';
import { OperationTrackingModel } from '../models/OperationTracking';
import { PlotModel } from '../models/Plot';
import type { ApiDocument } from '../types/apiDocument';
import { baleOrderTrackingToApiDocuments } from '../utils/baleOrderTrackingApiMapper';
import { contractorTrackingToApiDocuments } from '../utils/contractorTrackingApiMapper';
import { materialUsageTrackingToApiDocuments } from '../utils/materialUsageTrackingApiMapper';
import { operationTrackingToApiDocuments } from '../utils/operationTrackingApiMapper';
import {
  isFuelOperationType,
  unchargedBaleOrdersByCustomerFilter,
  unchargedBillableByPlotIdsFilter,
  unchargedBillableOperationsByPlotIdsFilter,
  unchargedByPlotIdsFilter,
  unchargedFilter,
} from '../utils/unbilledTrackingFilters';

const operationPopulate = {
  path: 'operation',
  select: '_id name operationType currentCost',
};
const plotPopulate = {
  path: 'plot',
  select: '_id name customer dunam',
  populate: { path: 'customer', select: '_id name' },
};
const employeePopulate = { path: 'employee', select: '_id name' };
const materialPopulate = {
  path: 'material',
  select: '_id name currentBuyingCost currentSalePercent pricingHistory',
};
const contractorPopulate = { path: 'contractor', select: '_id name' };
const contractorOperationPopulate = { path: 'operation', select: '_id name' };
const balePopulate = { path: 'bale', select: '_id name pricePerTon pricePerUnit' };
const baleCustomerPopulate = { path: 'customer', select: '_id name' };

async function resolveCustomerId(customerId: string): Promise<Types.ObjectId> {
  const id = String(customerId ?? '').trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('לקוח לא נמצא');
  }
  const customer = await CustomerModel.findById(id).select('_id').lean();
  if (!customer?._id) {
    throw new Error('לקוח לא נמצא');
  }
  return customer._id as Types.ObjectId;
}

async function loadPlotIdsForCustomer(customerId: Types.ObjectId): Promise<Types.ObjectId[]> {
  const plots = await PlotModel.find({ customer: customerId }).select('_id').lean();
  return plots.map((plot) => plot._id as Types.ObjectId);
}

async function distinctPlotIdsFromUnbilledOperations(): Promise<Types.ObjectId[]> {
  const rows = await OperationTrackingModel.find({
    ...unchargedFilter,
    billable: true,
    plot: { $exists: true, $ne: null },
  })
    .select('plot operation')
    .populate({ path: 'operation', select: 'operationType' })
    .lean();

  const plotIds = new Set<string>();
  for (const row of rows) {
    const operation = row.operation as { operationType?: unknown } | null;
    if (isFuelOperationType(operation?.operationType)) continue;
    if (row.plot) plotIds.add(String(row.plot));
  }
  return [...plotIds].map((id) => new Types.ObjectId(id));
}

async function collectCustomerIdsWithUnbilled(): Promise<Types.ObjectId[]> {
  const [baleCustomerIds, operationPlotIds, materialPlotIds, contractorPlotIds] =
    await Promise.all([
      BaleOrderTrackingModel.distinct('customer', unchargedFilter),
      distinctPlotIdsFromUnbilledOperations(),
      MaterialUsageTrackingModel.distinct('plot', {
        ...unchargedFilter,
        billable: true,
      }),
      ContractorTrackingModel.distinct('plot', unchargedFilter),
    ]);

  const plotIdSet = new Set<string>([
    ...operationPlotIds.map(String),
    ...materialPlotIds.map(String),
    ...contractorPlotIds.map(String),
  ]);
  const plotObjectIds = [...plotIdSet]
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  const plotCustomerIds =
    plotObjectIds.length > 0
      ? await PlotModel.distinct('customer', { _id: { $in: plotObjectIds } })
      : [];

  const allIds = new Set<string>([
    ...baleCustomerIds.map(String),
    ...plotCustomerIds.map(String),
  ]);

  return [...allIds]
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
}

export type UnbilledPreview = {
  operations: ApiDocument[];
  materialUsage: ApiDocument[];
  baleOrders: ApiDocument[];
  contractors: ApiDocument[];
};

export const customerBillingUnbilledService = {
  async listCustomersWithUnbilled(): Promise<{ customers: { _id: string; name: string }[] }> {
    const customerIds = await collectCustomerIdsWithUnbilled();
    if (customerIds.length === 0) {
      return { customers: [] };
    }

    const customers = await CustomerModel.find({ _id: { $in: customerIds } })
      .select('_id name')
      .sort({ name: 1 })
      .lean();

    return {
      customers: customers.map((customer) => ({
        _id: String(customer._id),
        name: String(customer.name ?? ''),
      })),
    };
  },

  /** Uncharged trackings for one customer; returned as JSON to the client preview tables. */
  async getUnbilledPreview(customerId: string): Promise<UnbilledPreview> {
    const customerObjectId = await resolveCustomerId(customerId);
    const plotIds = await loadPlotIdsForCustomer(customerObjectId);

    const [operationRows, materialRows, contractorRows, baleRows] = await Promise.all([
      plotIds.length > 0
        ? OperationTrackingModel.find(
            unchargedBillableOperationsByPlotIdsFilter(plotIds),
          )
            .populate(operationPopulate)
            .populate(plotPopulate)
            .populate(employeePopulate)
            .sort({ date: -1 })
            .lean()
        : [],
      plotIds.length > 0
        ? MaterialUsageTrackingModel.find(unchargedBillableByPlotIdsFilter(plotIds))
            .populate(materialPopulate)
            .populate(plotPopulate)
            .populate(employeePopulate)
            .sort({ date: -1 })
            .lean()
        : [],
      plotIds.length > 0
        ? ContractorTrackingModel.find(unchargedByPlotIdsFilter(plotIds))
            .populate(contractorPopulate)
            .populate(plotPopulate)
            .populate(contractorOperationPopulate)
            .sort({ date: -1 })
            .lean()
        : [],
      BaleOrderTrackingModel.find(unchargedBaleOrdersByCustomerFilter(customerObjectId))
        .populate(balePopulate)
        .populate(baleCustomerPopulate)
        .sort({ date: -1 })
        .lean(),
    ]);

    const operations = operationTrackingToApiDocuments(
      (operationRows as Record<string, unknown>[]).filter((row) => {
        const operation = row.operation as { operationType?: unknown } | undefined;
        return !isFuelOperationType(operation?.operationType);
      }),
    );

    return {
      operations,
      materialUsage: materialUsageTrackingToApiDocuments(
        materialRows as Record<string, unknown>[],
      ),
      baleOrders: baleOrderTrackingToApiDocuments(baleRows as Record<string, unknown>[]),
      contractors: contractorTrackingToApiDocuments(
        contractorRows as Record<string, unknown>[],
      ),
    };
  },
};
