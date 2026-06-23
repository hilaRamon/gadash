import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getCurrentSeasonYear,
  readStoredSeasonYear,
  writeStoredSeasonYear,
} from '../lib/seasonRange'

type SeasonContextValue = {
  selectedSeasonYear: number
  setSelectedSeasonYear: (year: number) => void
}

const SeasonContext = createContext<SeasonContextValue | null>(null)

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [selectedSeasonYear, setSelectedSeasonYearState] = useState(() => {
    return readStoredSeasonYear() ?? getCurrentSeasonYear()
  })

  const setSelectedSeasonYear = useCallback((year: number) => {
    setSelectedSeasonYearState(year)
    writeStoredSeasonYear(year)
  }, [])

  const value = useMemo(
    () => ({ selectedSeasonYear, setSelectedSeasonYear }),
    [selectedSeasonYear, setSelectedSeasonYear],
  )

  return (
    <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>
  )
}

export function useSeason(): SeasonContextValue {
  const context = useContext(SeasonContext)
  if (!context) {
    throw new Error('useSeason must be used within SeasonProvider')
  }
  return context
}
