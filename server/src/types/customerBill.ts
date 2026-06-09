export type CustomerBillSectionLayout = 'operations' | 'quantityWithUnitPrice';

export type CustomerBillLine = {
  date: string;
  description: string;
  plotName?: string;
  amount?: string;
  unitPrice?: string;
  price: number;
  priceFormatted: string;
};

export type CustomerBillSection = {
  title: string;
  layout: CustomerBillSectionLayout;
  lines: CustomerBillLine[];
  subtotal: number;
  subtotalFormatted: string;
};

export type CustomerBillDocument = {
  customerName: string;
  billDate: string;
  sections: CustomerBillSection[];
  total: number;
  totalFormatted: string;
};

export type CustomerBillRequest = {
  customerId: string;
  operationsTrackingIds?: unknown;
  contractorTrackingIds?: unknown;
  materialUsageTrackingIds?: unknown;
  baleOrderTrackingIds?: unknown;
};
