export type CustomerBillSectionLayout = "operations" | "quantityWithUnitPrice";

export type CustomerBillLine = {
  date: string;
  description: string;
  plotName?: string;
  pricingForm?: string;
  amount?: string;
  unitPrice?: string;
  transportPrice?: string;
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
  showPlots: boolean;
  sections: CustomerBillSection[];
  total: number;
  totalFormatted: string;
};

export type CustomerBillRequest = {
  customerId: string;
  operationsTrackingIds: string[];
  contractorTrackingIds: string[];
  materialUsageTrackingIds: string[];
  baleOrderTrackingIds: string[];
};
