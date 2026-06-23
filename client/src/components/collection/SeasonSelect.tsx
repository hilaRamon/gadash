import styled from 'styled-components'
import { useCollectionList } from '../../hooks/collections/useCollectionList'
import { useSeason } from '../../context/SeasonContext'
import { getCurrentSeasonYear } from '../../lib/seasonRange'
import { SearchableSelect } from '../ui/SearchableSelect'

export function SeasonSelect() {
  const { selectedSeasonYear, setSelectedSeasonYear } = useSeason()
  const { data: seasons = [], isLoading } = useCollectionList('agriculturalSeasons')

  const options = seasons
    .map((season) => {
      const year = Number(season.year)
      if (!Number.isFinite(year)) return null
      return { value: String(year), label: String(year) }
    })
    .filter((option): option is { value: string; label: string } => option != null)
    .sort((a, b) => Number(b.value) - Number(a.value))

  const fallbackYear = getCurrentSeasonYear()
  const value =
    options.some((option) => option.value === String(selectedSeasonYear))
      ? String(selectedSeasonYear)
      : String(fallbackYear)

  return (
    <SeasonSelectRoot>
      <SeasonSelectLabel htmlFor="sidebar-season-select">נתונים לעונה:</SeasonSelectLabel>
      <SearchableSelect
        id="sidebar-season-select"
        value={value}
        options={
          options.length > 0
            ? options
            : [{ value: String(fallbackYear), label: String(fallbackYear) }]
        }
        required
        disabled={isLoading && options.length === 0}
        isLoading={isLoading}
        onChange={(next) => {
          const year = Number(next)
          if (Number.isFinite(year)) setSelectedSeasonYear(year)
        }}
      />
    </SeasonSelectRoot>
  )
}

const SeasonSelectRoot = styled.div`
  margin-top: 0.75rem;
`

const SeasonSelectLabel = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
`
