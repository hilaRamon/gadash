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
  getAuthToken,
  getUserFromToken,
  isAuthTokenExpired,
  loginRequest,
  setAuthToken,
  type AuthUser,
} from '../lib/auth'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isReady: boolean
  login: (employeeId: string, mobile: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token = getAuthToken()
      if (!token || isAuthTokenExpired(token)) {
        clearAuthToken()
        if (!cancelled) {
          setUser(null)
          setIsReady(true)
        }
        return
      }

      const cachedUser = getUserFromToken(token)
      if (cachedUser) {
        if (!cancelled) setUser(cachedUser)
      }

      try {
        const currentUser = await fetchCurrentUser()
        if (!cancelled) setUser(currentUser)
      } catch {
        clearAuthToken()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsReady(true)
      }
    }

    void restoreSession()

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

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
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
