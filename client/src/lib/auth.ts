import api from './api'

export type AuthRole = 'employee' | 'admin'

export type AuthUser = {
  _id: string
  name: string
  role: AuthRole
}

type JwtPayload = {
  sub: string
  name: string
  role: AuthRole
  exp: number
}

type LoginOption = {
  _id: string
  name: string
}

const TOKEN_STORAGE_KEY = 'gadash.authToken'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const encoded = token.split('.')[1]
    if (!encoded) return null
    const json = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function isAuthTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload?.exp) return true
  return payload.exp * 1000 <= Date.now()
}

export function getUserFromToken(token: string): AuthUser | null {
  const payload = parseJwtPayload(token)
  if (!payload?.sub || !payload.name || !payload.role) return null
  if (isAuthTokenExpired(token)) return null

  return {
    _id: payload.sub,
    name: payload.name,
    role: payload.role,
  }
}

export async function fetchLoginOptions(): Promise<LoginOption[]> {
  const { data } = await api.get<LoginOption[]>('/api/auth/login-options')
  return data
}

export async function loginRequest(
  employeeId: string,
  mobile: string,
): Promise<{ token: string; employee: AuthUser }> {
  const { data } = await api.post<{ token: string; employee: AuthUser }>(
    '/api/auth/login',
    { employeeId, mobile },
  )
  return data
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/api/auth/me')
  return data
}
