import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

type ContractorSeed = {
  name: string
  mobile?: string
  email?: string
  notes?: string
}

const contractors: ContractorSeed[] = [
  { name: 'משאית עייש' },
  { name: 'שופל קוקו' },
  { name: 'אלעד שילוני - כפות תמרים' },
  { name: 'טרקטור הר כביר' },
  { name: 'פיקויות קוקו' },
  { name: 'שופל ביטי' },
  { name: 'נעם גקסון' },
  { name: 'שימי מועלם גידולים חקלאיים בע"מ', mobile: '0505478094' },
  { name: 'משאית יוחנן' },
  { name: 'שלמה - הר כביר' },
  { name: 'מוטורגריידר בע"מ', mobile: '03-6872497' },
  { name: 'ישי בראון' },
  { name: 'שופל הר כביר' },
]

export const contractorsSeedData: CollectionDocument[] = contractors.map((row, index) => ({
  _id: mockObjectId(`contractor-${index + 1}`),
  name: row.name,
  mobile: row.mobile ?? '',
  email: row.email ?? '',
  notes: row.notes ?? '',
}))
