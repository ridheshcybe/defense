// Session persistence for auth tokens. The login form's "Remember me" flag
// decides between localStorage (survives reloads) and sessionStorage (dies with
// the tab). Shared by AuthContext (write) and the API client (read bearer).

export const SESSION_TOKEN_KEY = 'sf.token'
export const SESSION_REFRESH_KEY = 'sf.refreshToken'
export const SESSION_USER_KEY = 'sf.user'
export const REMEMBER_KEY = 'sf.remember'

export function isRemembered(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(REMEMBER_KEY) !== '0'
  } catch {
    return true
  }
}

export function sessionStore(): Storage | null {
  if (typeof window === 'undefined') return null
  return isRemembered() ? window.localStorage : window.sessionStorage
}

export function readSessionValue(key: string): string | null {
  const store = sessionStore()
  if (!store) return null
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

/** Writes a session value to the active store; `null` removes it from both stores. */
export function writeSessionValue(key: string, value: string | null): void {
  const store = sessionStore()
  if (!store || typeof window === 'undefined') return
  const other = store === window.localStorage ? window.sessionStorage : window.localStorage
  try {
    if (value === null) {
      store.removeItem(key)
      other.removeItem(key)
    } else {
      store.setItem(key, value)
    }
  } catch {
    // Storage unavailable (private mode / quota) — session stays in memory.
  }
}

export function getSessionToken(): string | null {
  return readSessionValue(SESSION_TOKEN_KEY)
}
