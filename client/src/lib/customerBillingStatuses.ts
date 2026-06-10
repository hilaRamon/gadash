export const CUSTOMER_BILLING_STATUSES = [
  "לא אושר כלל",
  "אושר ע״י לקוח",
  "הופקה חשבונית",
] as const;

export const customerBillingStatusOptions = CUSTOMER_BILLING_STATUSES.map(
  (value) => ({ value, label: value }),
);
