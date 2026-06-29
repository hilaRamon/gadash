import type { Types } from 'mongoose';
import { TRANSPORT_CUSTOMER_BILLING } from '../models/TransportTracking';

/** Rows not yet charged to a customer billing document. */
export const unchargedFilter = { wasCharged: { $ne: true } } as const;

export function unchargedByPlotIdsFilter(plotIds: Types.ObjectId[]) {
  return {
    ...unchargedFilter,
    plot: { $in: plotIds },
  };
}

export function unchargedBillableByPlotIdsFilter(plotIds: Types.ObjectId[]) {
  return {
    ...unchargedFilter,
    billable: true,
    plot: { $in: plotIds },
  };
}

export function unchargedBillableOperationsByPlotIdsFilter(plotIds: Types.ObjectId[]) {
  return {
    ...unchargedFilter,
    billable: true,
    plot: { $exists: true, $ne: null, $in: plotIds },
  };
}

export function unchargedBaleOrdersByCustomerFilter(customerId: Types.ObjectId) {
  return {
    ...unchargedFilter,
    customer: customerId,
  };
}

export function unchargedTransportBillingsByCustomerFilter(customerId: Types.ObjectId) {
  return {
    ...unchargedFilter,
    customer: customerId,
    billing: TRANSPORT_CUSTOMER_BILLING,
  };
}

export function isFuelOperationType(operationType: unknown): boolean {
  return String(operationType ?? '') === 'דלק';
}
