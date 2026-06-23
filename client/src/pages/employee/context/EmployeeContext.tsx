import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useCollectionList } from '../../../hooks/collections/useCollectionList'
import { todayIso } from '../lib/formDefaults'

const STORAGE_KEY = 'gadash.employeeId'

type EmployeeContextValue = {
  employeeId: string | null
  employeeName: string | null
  trackingDate: string
  isCustomDate: boolean
  setTrackingDate: (date: string) => void
  resetTrackingDate: () => void
  setEmployee: (id: string, name: string) => void
  clearEmployee: () => void
  isReady: boolean
}

const EmployeeContext = createContext<EmployeeContextValue | null>(null)

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [employeeName, setEmployeeName] = useState<string | null>(null)
  const [trackingDate, setTrackingDateState] = useState(todayIso)
  const [isReady, setIsReady] = useState(false)
  const { data: employees = [] } = useCollectionList('employees')

  const isCustomDate = trackingDate !== todayIso()

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY)
    if (storedId) {
      setEmployeeId(storedId)
    }
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!employeeId) {
      setEmployeeName(null)
      return
    }
    const match = employees.find((row) => String(row._id) === employeeId)
    if (match?.name) {
      setEmployeeName(String(match.name))
    }
  }, [employeeId, employees])

  const setTrackingDate = useCallback((date: string) => {
    setTrackingDateState(date)
  }, [])

  const resetTrackingDate = useCallback(() => {
    setTrackingDateState(todayIso())
  }, [])

  const setEmployee = useCallback((id: string, name: string) => {
    localStorage.setItem(STORAGE_KEY, id)
    setEmployeeId(id)
    setEmployeeName(name)
  }, [])

  const clearEmployee = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setEmployeeId(null)
    setEmployeeName(null)
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
      setEmployee,
      clearEmployee,
      isReady,
    }),
    [
      employeeId,
      employeeName,
      trackingDate,
      isCustomDate,
      setTrackingDate,
      resetTrackingDate,
      setEmployee,
      clearEmployee,
      isReady,
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
