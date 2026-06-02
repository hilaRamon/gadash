import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

type SupplierSeed = {
  name: string
  mobile?: string
  email?: string
}

const suppliers: SupplierSeed[] = [
  { name: 'אדמה חיה' },
  { name: 'אלאקס מערכות בקרה בע"מ' },
  { name: 'דור כימיקלים' },
  { name: 'דשן הצפון' },
  { name: 'הזרע דרך ישי' },
  { name: 'הכל בו לגן' },
  { name: 'המשביר לחקלאי' },
  { name: 'המשביר לחקלאי – תומר' },
  { name: 'המשביר לחקלאי – בית שאן' },
  { name: 'זרעי הנגב' },
  { name: 'זרעי הנגב אגש"ח' },
  { name: 'י. בראון' },
  { name: 'ישי' },
  { name: 'ישי בראון (הזרע)' },
  { name: 'מיכה קוריס בע"מ' },
  { name: 'עמיר שיווק' },
  { name: 'קומפוסט אור' },
  { name: 'קיבוץ דליה' },
  { name: 'רוני ארביב' },
  { name: 'שימי מועלם גידולים' },
]

export const suppliersSeedData: CollectionDocument[] = suppliers.map((row, index) => ({
  _id: mockObjectId(`supplier-${index + 1}`),
  name: row.name,
  mobile: row.mobile ?? '',
  email: row.email ?? '',
}))
