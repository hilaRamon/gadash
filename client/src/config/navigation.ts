export type DataCollection = {
  id: string
  label: string
  path: string
  collection: string
}

export const dataCollections: DataCollection[] = [
  { id: 'employees', label: 'עובדים', path: '/data/employees', collection: 'employees' },
  { id: 'customers', label: 'לקוחות', path: '/data/customers', collection: 'customers' },
  {
    id: 'contractors',
    label: 'קבלנים ונותני שירות',
    path: '/data/contractors',
    collection: 'contractors',
  },
  { id: 'operations', label: 'פעולות', path: '/data/operations', collection: 'operations' },
  { id: 'materials', label: 'חומרים', path: '/data/materials', collection: 'materials' },
  { id: 'bales', label: 'חבילות (חציר)', path: '/data/bales', collection: 'bales' },
  { id: 'tractors', label: 'כלים (טרקטורים)', path: '/data/tractors', collection: 'tractors' },
  { id: 'plots', label: 'חלקות', path: '/data/plots', collection: 'plots' },
  { id: 'fuel-tanks', label: 'מיכלי דלק', path: '/data/fuel-tanks', collection: 'fuelTanks' },
  {
    id: 'seasons',
    label: 'עונות חקלאיות',
    path: '/data/seasons',
    collection: 'agriculturalSeasons',
  },
]

export const sidebarSections = [
  { id: 'data', title: 'נתונים', items: dataCollections },
  { id: 'trackings', title: 'מעקבים', path: '/trackings' },
  { id: 'reports', title: 'דוחות', path: '/reports' },
] as const
