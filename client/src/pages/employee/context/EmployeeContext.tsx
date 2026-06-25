import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '../../../context/AuthContext'
import { todayIso } from '../lib/formDefaults'

type EmployeeContextValue = {
  employeeId: string | null
  employeeName: string | null
  trackingDate: string
  isCustomDate: boolean
  setTrackingDate: (date: string) => void
  resetTrackingDate: () => void
  isReady: boolean
}

const EmployeeContext = createContext<EmployeeContextValue | null>(null)

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isReady: authReady } = useAuth()
  const [trackingDate, setTrackingDateState] = useState(todayIso)

  const employeeId = isAuthenticated ? (user?._id ?? null) : null
  const employeeName = isAuthenticated ? (user?.name ?? null) : null
  const isCustomDate = trackingDate !== todayIso()

  const setTrackingDate = useCallback((date: string) => {
    setTrackingDateState(date)
  }, [])

  const resetTrackingDate = useCallback(() => {
    setTrackingDateState(todayIso())
  }, [])

  const value = useMemo(
    () => ({
      employeeId,
      employeeName,
      trackingDate,
      isCustomDate,
      setTrackingDate,
      resetTrackingDate,
      isReady: authReady,
    }),
    [
      employeeId,
      employeeName,
      trackingDate,
      isCustomDate,
      setTrackingDate,
      resetTrackingDate,
      authReady,
    ],
  )

  return (
    <EmployeeContext.Provider value={value}>{children}</EmployeeContext.Provider>
  )
}

export function useEmployee() {
  const context = useContext(EmployeeContext)
  if (!context) {
    throw new Error('useEmployee must be used within EmployeeProvider')
  }
  return context
}
