import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { decodeToken, isTokenExpired, login as apiLogin, logout as apiLogout, refreshToken as apiRefreshToken } from '../api/authApi'
import {
  SESSION_REFRESH_KEY,
  SESSION_TOKEN_KEY,
  SESSION_USER_KEY,
  readSessionValue,
  writeSessionValue,
} from '../api/session'

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  refreshToken: () => Promise<void>
  checkAuth: () => Promise<void>
}

interface StoredSession {
  token: string | null
  refresh: string | null
  user: User | null
}

function readStoredSession(): StoredSession {
  try {
    const token = readSessionValue(SESSION_TOKEN_KEY)
    const refresh = readSessionValue(SESSION_REFRESH_KEY)
    const rawUser = readSessionValue(SESSION_USER_KEY)
    return {
      token,
      refresh,
      user: rawUser ? (JSON.parse(rawUser) as User) : null,
    }
  } catch {
    return { token: null, refresh: null, user: null }
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refresh, setRefresh] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Refs keep the async callbacks (login/refresh/checkAuth) stable while still
  // reading the freshest session values.
  const refreshRef = useRef<string | null>(null)
  const userRef = useRef<User | null>(null)
  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])
  useEffect(() => {
    userRef.current = user
  }, [user])

  /**
   * Writes session values to the active store (localStorage when remembered,
   * sessionStorage otherwise). `undefined` leaves the key untouched, `null`
   * removes it, a string/object persists it.
   */
  const persist = useCallback(
    (values: { token?: string | null; refresh?: string | null; user?: User | null }) => {
      try {
        if (values.token !== undefined) writeSessionValue(SESSION_TOKEN_KEY, values.token)
        if (values.refresh !== undefined) writeSessionValue(SESSION_REFRESH_KEY, values.refresh)
        if (values.user !== undefined) {
          writeSessionValue(SESSION_USER_KEY, values.user ? JSON.stringify(values.user) : null)
        }
      } catch {
        // Storage unavailable (private mode / quota) — session stays in memory.
      }
    },
    [],
  )

  const clearSession = useCallback(() => {
    setUser(null)
    setToken(null)
    setRefresh(null)
    persist({ token: null, refresh: null, user: null })
  }, [persist])

  const refreshToken = useCallback(async () => {
    const currentRefresh = refreshRef.current
    if (!currentRefresh) {
      clearSession()
      return
    }
    try {
      const tokens = await apiRefreshToken(currentRefresh)
      setToken(tokens.token)
      setRefresh(tokens.refreshToken)
      persist({ token: tokens.token, refresh: tokens.refreshToken })
    } catch {
      clearSession()
    }
  }, [clearSession, persist])

  // Auto-refresh shortly before the access token expires.
  useEffect(() => {
    if (!token) return
    const decoded = decodeToken(token)
    if (!decoded) return
    const delay = Math.max(0, decoded.exp - Date.now() - 60_000)
    const timer = setTimeout(() => {
      void refreshToken()
    }, delay)
    return () => clearTimeout(timer)
  }, [token, refreshToken])

  const checkAuth = useCallback(async () => {
    try {
      const stored = readStoredSession()
      if (stored.token && stored.user && !isTokenExpired(stored.token)) {
        setUser(stored.user)
        setToken(stored.token)
        setRefresh(stored.refresh)
        return
      }
      if (stored.refresh) {
        // Access token missing or expired — try a refresh before forcing re-login.
        const tokens = await apiRefreshToken(stored.refresh)
        setToken(tokens.token)
        setRefresh(tokens.refreshToken)
        if (stored.user) setUser(stored.user)
        persist({ token: tokens.token, refresh: tokens.refreshToken })
        return
      }
    } catch {
      // Fall through to a signed-out session.
    }
    setUser(null)
    setToken(null)
    setRefresh(null)
    persist({ token: null, refresh: null, user: null })
  }, [persist])

  useEffect(() => {
    void checkAuth().finally(() => setIsLoading(false))
  }, [checkAuth])

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const response = await apiLogin(email, password)
      setUser(response.user)
      setToken(response.token)
      setRefresh(response.refreshToken)
      persist({
        token: response.token,
        refresh: response.refreshToken,
        user: response.user,
      })
      return response.user
    },
    [persist],
  )

  const logout = useCallback(() => {
    const currentToken = token
    if (currentToken) void apiLogout(currentToken).catch(() => {})
    clearSession()
  }, [token, clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token && !isTokenExpired(token)),
      login,
      logout,
      refreshToken,
      checkAuth,
    }),
    [user, token, isLoading, login, logout, refreshToken, checkAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
