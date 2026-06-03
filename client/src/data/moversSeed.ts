import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

type MoverSeed = {
  name: string
  mobile?: string
  email?: string
  hourlyRate?: number
}

const movers: MoverSeed[] = [
  { name: 'יוחנן' },
  { name: 'פריאל' },
  { name: 'ראובן הלל' },
]

export const moversSeedData: CollectionDocument[] = movers.map((row, index) => ({
  _id: mockObjectId(`mover-${index + 1}`),
  name: row.name,
  mobile: row.mobile ?? '',
  email: row.email ?? '',
  hourlyRate: row.hourlyRate ?? 0,
}))
