import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAuthToken,
  fetchCurrentUser,
  loginRequest,
  readStoredUser,
  setAuthToken,
  type AuthUser,
} from '../lib/auth'
import { registerUnauthorizedHandler } from '../lib/authSession'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isReady: boolean
  login: (employeeId: string, mobile: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)
  const [isReady] = useState(true)

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
  }, [])

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      setUser(null)
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    async function validateSession() {
      const storedUser = readStoredUser()
      if (!storedUser) {
        if (!cancelled) setUser(null)
        return
      }

      if (!cancelled) setUser(storedUser)

      try {
        const currentUser = await fetchCurrentUser()
        if (!cancelled) setUser(currentUser)
      } catch {
        clearAuthToken()
        if (!cancelled) setUser(null)
      }
    }

    void validateSession()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (employeeId: string, mobile: string) => {
    const { token, employee } = await loginRequest(employeeId, mobile)
    setAuthToken(token)
    setUser(employee)
    return employee
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user != null,
      isReady,
      login,
      logout,
    }),
    [user, isReady, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
