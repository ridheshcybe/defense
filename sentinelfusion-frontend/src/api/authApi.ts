import { ApiError } from '../types/api'
import type { User, UserRole } from '../types'

// Demo auth backend, shaped like a real /auth endpoint on the TokenRouter gateway.
// Swaps cleanly for a real fetch() once the backend ships (see client.ts for the
// apiRequest<T>() pattern). Tokens are self-contained mock JWTs (base64 payload),
// so expiry is testable without a server.
const SIMULATED_DELAY_MS = 400
const ACCESS_TTL_MS = 15 * 60 * 1000 // 15 minutes

export interface AuthTokens {
  token: string
  refreshToken: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}

export interface DemoAccount {
  email: string
  password: string
  user: User
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'analyst@fusion.dev',
    password: 'analyst123',
    user: { id: 'u-analyst', email: 'analyst@fusion.dev', name: 'Aria Singh', role: 'analyst' },
  },
  {
    email: 'ops@fusion.dev',
    password: 'ops123',
    user: { id: 'u-ops', email: 'ops@fusion.dev', name: 'Dev Patel', role: 'field_ops' },
  },
  {
    email: 'exec@fusion.dev',
    password: 'exec123',
    user: { id: 'u-exec', email: 'exec@fusion.dev', name: 'Rhea Menon', role: 'leadership' },
  },
  {
    email: 'crew@fusion.dev',
    password: 'crew123',
    user: { id: 'u-crew', email: 'crew@fusion.dev', name: 'Kabir Rao', role: 'crew_transport' },
  },
]

function encodeBase64(value: string): string {
  return btoa(unescape(encodeURIComponent(value)))
}

function decodeBase64(value: string): string {
  return decodeURIComponent(escape(atob(value)))
}

/** Builds a demo JWT: header.payload.signature with an exp claim. */
export function makeJWT(user: User, ttlMs: number = ACCESS_TTL_MS): string {
  const header = encodeBase64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = encodeBase64(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + ttlMs,
    }),
  )
  return `${header}.${payload}.demo-signature`
}

export interface DecodedToken {
  exp: number
  role: UserRole
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = JSON.parse(decodeBase64(token.split('.')[1] ?? '')) as DecodedToken
    return { exp: payload.exp, role: payload.role }
  } catch {
    return null
  }
}

/** True when the token is missing, malformed, or within `skewMs` of expiring. */
export function isTokenExpired(token: string, skewMs = 30_000): boolean {
  const decoded = decodeToken(token)
  if (!decoded) return true
  return decoded.exp - skewMs <= Date.now()
}

async function simulate<T>(producer: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))
  return producer()
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return simulate(() => {
    const account = DEMO_ACCOUNTS.find(
      (entry) => entry.email.toLowerCase() === email.trim().toLowerCase(),
    )
    if (!account || account.password !== password) {
      throw new ApiError('auth', 401, 'Invalid email or password.')
    }
    return {
      token: makeJWT(account.user),
      refreshToken: `rt.${encodeBase64(`${account.user.id}.${Date.now()}`)}`,
      user: account.user,
    }
  })
}

export async function logout(_token: string): Promise<void> {
  return simulate(() => undefined)
}

export async function refreshToken(refreshTokenValue: string): Promise<AuthTokens> {
  return simulate(() => {
    if (!refreshTokenValue.startsWith('rt.')) {
      throw new ApiError('auth', 401, 'Session expired. Please log in again.')
    }
    const id = decodeBase64(refreshTokenValue.slice(3)).split('.')[0]
    const account = DEMO_ACCOUNTS.find((entry) => entry.user.id === id)
    if (!account) {
      throw new ApiError('auth', 401, 'Session expired. Please log in again.')
    }
    return {
      token: makeJWT(account.user),
      refreshToken: `rt.${encodeBase64(`${account.user.id}.${Date.now()}`)}`,
    }
  })
}
