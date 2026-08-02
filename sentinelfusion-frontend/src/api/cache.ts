const DEFAULT_TTL_MS = 5 * 60 * 1000

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.timestamp > ttlMs) {
    store.delete(key)
    return undefined
  }
  return entry.data as T
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() })
}

export function clearCache(): void {
  store.clear()
}

export function removeCached(key: string): void {
  store.delete(key)
}
