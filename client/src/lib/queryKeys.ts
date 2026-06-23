import type { ListCollectionParams } from '../lib/listCollectionParams'

export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (collection: string, params?: ListCollectionParams) =>
    [...collectionKeys.lists(), collection, params ?? {}] as const,
  detail: (collection: string, id: string) =>
    [...collectionKeys.all, 'detail', collection, id] as const,
}

export const transportChargeStateKeys = {
  all: ['transportChargeState'] as const,
  detail: () => [...transportChargeStateKeys.all, 'detail'] as const,
}

export const customerBillingKeys = {
  all: ['customerBilling'] as const,
  customersWithUnbilled: () =>
    [...customerBillingKeys.all, 'customersWithUnbilled'] as const,
  unbilledPreview: (customerId: string) =>
    [...customerBillingKeys.all, 'unbilledPreview', customerId] as const,
  billPreview: (customerId: string, request: unknown) =>
    [...customerBillingKeys.all, 'billPreview', customerId, request] as const,
  billPreviewForCustomer: (customerId: string) =>
    [...customerBillingKeys.all, 'billPreview', customerId] as const,
  savedBillPreview: (billingId: string) =>
    [...customerBillingKeys.all, 'savedBillPreview', billingId] as const,
}

export const monthlyReportKeys = {
  all: ['monthlyReport'] as const,
  employee: (employeeId: string, month: string) =>
    [...monthlyReportKeys.all, 'employee', employeeId, month] as const,
  summary: (month: string) =>
    [...monthlyReportKeys.all, 'summary', month] as const,
}
