import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

type TractorSeed = {
  licenseNumber: string
  name: string
}

const tractors: TractorSeed[] = [
  { licenseNumber: '38-584-81', name: '8200' },
  { licenseNumber: '666-40-804', name: '6250' },
  { licenseNumber: '11111111', name: 'מחפרון הר כביר' },
  { licenseNumber: '111111', name: 'ללא כלי' },
  { licenseNumber: '123456', name: '6215' },
  { licenseNumber: '660483', name: 'קומביין' },
  { licenseNumber: '3859881', name: '8230' },
  { licenseNumber: '9352114', name: 'חדש 7520' },
  { licenseNumber: '0000', name: 'מניסקופ' },
  { licenseNumber: '99-355-79', name: '6210' },
  { licenseNumber: '92-217-14', name: '7520' },
  { licenseNumber: '00-000-00', name: 'שופל הר כביר' },
]

export const tractorsSeedData: CollectionDocument[] = tractors.map((row, index) => ({
  _id: mockObjectId(`tractor-${index + 1}`),
  licenseNumber: row.licenseNumber,
  name: row.name,
}))
