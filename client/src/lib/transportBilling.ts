export const TRANSPORT_BILLING_TYPES = [
  "לא לחיוב",
  "חיוב ללקוח",
  "חיוב גלובלי",
] as const;

export type TransportBillingType = (typeof TRANSPORT_BILLING_TYPES)[number];

export const DEFAULT_TRANSPORT_BILLING: TransportBillingType = "חיוב גלובלי";
export const TRANSPORT_CUSTOMER_BILLING: TransportBillingType = "חיוב ללקוח";
