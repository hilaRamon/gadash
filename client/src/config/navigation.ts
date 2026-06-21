export type DataCollection = {
  id: string;
  label: string;
  path: string;
  collection: string;
};

export type TrackingCollection = {
  id: string;
  label: string;
  path: string;
  collection: string;
};

export const dataCollections: DataCollection[] = [
  {
    id: "employees",
    label: "עובדים",
    path: "/data/employees",
    collection: "employees",
  },
  {
    id: "customers",
    label: "לקוחות",
    path: "/data/customers",
    collection: "customers",
  },
  {
    id: "contractors",
    label: "קבלנים ונותני שירות",
    path: "/data/contractors",
    collection: "contractors",
  },
  {
    id: "movers",
    label: "מובילים",
    path: "/data/movers",
    collection: "movers",
  },
  {
    id: "suppliers",
    label: "ספקים",
    path: "/data/suppliers",
    collection: "suppliers",
  },
  {
    id: "operations",
    label: "פעולות",
    path: "/data/operations",
    collection: "operations",
  },
  {
    id: "materials",
    label: "חומרים",
    path: "/data/materials",
    collection: "materials",
  },
  {
    id: "bales",
    label: "חבילות (חציר)",
    path: "/data/bales",
    collection: "bales",
  },
  {
    id: "tractors",
    label: "כלים (טרקטורים)",
    path: "/data/tractors",
    collection: "tractors",
  },
  { id: "plots", label: "חלקות", path: "/data/plots", collection: "plots" },
  {
    id: "fuel-tanks",
    label: "מיכלי דלק",
    path: "/data/fuel-tanks",
    collection: "fuelTanks",
  },
  {
    id: "seasons",
    label: "עונות חקלאיות",
    path: "/data/seasons",
    collection: "agriculturalSeasons",
  },
];

export const materialTrackingCollections: TrackingCollection[] = [
  {
    id: "material-usage-trackings",
    label: "שימוש בחומרים",
    path: "/trackings/material-usage",
    collection: "materialUsageTrackings",
  },
  {
    id: "material-purchase-trackings",
    label: "רכש חומרים",
    path: "/trackings/material-purchase",
    collection: "materialPurchaseTrackings",
  },
];

export const operationsTrackingCollections: TrackingCollection[] = [
  {
    id: "operations-trackings-all",
    label: "הכל",
    path: "/trackings/operations/all",
    collection: "operationsTrackings",
  },
  {
    id: "operations-trackings-field-work",
    label: "עיבודים",
    path: "/trackings/operations/field-work",
    collection: "operationsTrackings",
  },
  {
    id: "operations-trackings-admin",
    label: "מנהלות",
    path: "/trackings/operations/admin",
    collection: "operationsTrackings",
  },
];

export const fuelTrackingCollections: TrackingCollection[] = [
  {
    id: "fuel-operations-trackings",
    label: "פעולות דלק",
    path: "/trackings/fuel-operations",
    collection: "fuelOperationsTrackings",
  },
];

export const contractorTrackingCollections: TrackingCollection[] = [
  {
    id: "contractor-trackings",
    label: "קבלנים",
    path: "/trackings/contractors",
    collection: "contractorTrackings",
  },
];

export const transportTrackingCollections: TrackingCollection[] = [
  {
    id: "transport-trackings",
    label: "הובלות",
    path: "/trackings/transport",
    collection: "transportTrackings",
  },
];

export const baleTrackingCollections: TrackingCollection[] = [
  {
    id: "bale-order-trackings",
    label: "הזמנות חבילות",
    path: "/trackings/bale-orders",
    collection: "baleOrderTrackings",
  },
];

export const customerBillingTrackingCollections: TrackingCollection[] = [
  {
    id: "customer-billing-trackings",
    label: "מעקב חיובי לקוחות",
    path: "/trackings/customer-billing",
    collection: "customerBillingTrackings",
  },
];

export type ReportCollection = {
  id: string;
  label: string;
  path: string;
};

export const reportCollections: ReportCollection[] = [
  {
    id: "employee-monthly-report",
    label: "דוח חודשי לעובד",
    path: "/reports/employee-monthly",
  },
  {
    id: "monthly-summary",
    label: "סיכום חודשי",
    path: "/reports/monthly-summary",
  },
];

export const trackingCollections: TrackingCollection[] = [
  ...materialTrackingCollections,
  ...operationsTrackingCollections,
  ...contractorTrackingCollections,
  ...transportTrackingCollections,
  ...fuelTrackingCollections,
  ...baleTrackingCollections,
  ...customerBillingTrackingCollections,
];

export const sidebarSections = [
  { id: "data", title: "נתונים", items: dataCollections },
  { id: "trackings", title: "מעקבים", items: trackingCollections },
  { id: "reports", title: "דוחות", path: "/reports" },
] as const;
