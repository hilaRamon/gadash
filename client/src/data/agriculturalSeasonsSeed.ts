import { mockObjectId } from '../lib/mockObjectId'
import type { CollectionDocument } from '../schema/types'

const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

export const agriculturalSeasonsSeedData: CollectionDocument[] = years.map(
  (year) => ({
    _id: mockObjectId(`agricultural-season-${year}`),
    year,
  }),
)
