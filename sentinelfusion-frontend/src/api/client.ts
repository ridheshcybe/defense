import { ApiError } from '../types/api'
import type { ApiResponse } from '../types/api'
import type { AOI, Incident } from '../types'
import { getSessionToken } from './session'

// NOTE: embedding an API key in a client bundle is demo-only. In production,
// proxy these requests through a backend so the key never reaches the browser.
// The shell's OPENAI_API_KEY is exposed to the client via Vite's envPrefix.
const API_KEY: string = import.meta.env.OPENAI_API_KEY ?? import.meta.env.VITE_OPENAI_API_KEY ?? ''

/** Authorization value: the signed-in user's JWT when present, else the API key. */
function authorization(): string {
  const sessionToken = getSessionToken()
  return `Bearer ${sessionToken ?? API_KEY}`
}

const API_BASE = 'https://tokenrouter.me/v1'
const TIMEOUT_MS = 10_000
const DEFAULT_RETRIES = 2
const BACKOFF_MS = [1_000, 2_000]

function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as ApiResponse<T>).data
  }
  return body as T
}

/** Retries `fn` up to `retries` times with exponential backoff on failure. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = DEFAULT_RETRIES,
  backoff: number[] = BACKOFF_MS,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, backoff[attempt] ?? 0))
      }
    }
  }
  throw lastError
}

/**
 * Sends an authenticated JSON request to `baseUrl + endpoint` with a 10s
 * timeout and 2 retries. `baseUrl` defaults to the TokenRouter gateway and can
 * be overridden to reach a separate service (e.g. the local AI pipeline).
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = API_BASE,
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization(),
        ...options.headers,
      },
      signal: controller.signal,
    })
    if (!response.ok) {
      throw ApiError.fromStatus(response.status)
    }
    const body: unknown = await response.json()
    return unwrap<T>(body)
  } catch (err) {
    if (err instanceof ApiError) throw err
    // AbortError comes from our own timeout; any other failure is a network problem.
    // Preserve the original error as `cause` so Report Issue can log diagnostics.
    throw new ApiError('network', null, undefined, err)
  } finally {
    clearTimeout(timeoutId)
  }
}

export function getAOIs(): Promise<AOI[]> {
  return apiRequest<AOI[]>('/aois')
}

export function getIncidents(aoiId?: string): Promise<Incident[]> {
  const query = aoiId ? `?aoiId=${encodeURIComponent(aoiId)}` : ''
  return apiRequest<Incident[]>(`/incidents${query}`)
}

export function getIncidentById(id: string): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${encodeURIComponent(id)}`)
}
