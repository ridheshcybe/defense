import { useCallback, useEffect, useRef, useState } from 'react'
import type { AOI } from '../types'
import { fetchAOIs as fetchAOIsFromApi } from '../api/aoiApi'
import { getCached, setCached } from '../api/cache'

export type AOIFetcher = () => Promise<AOI[]>

const CACHE_KEY = 'aois'

/**
 * Default fetcher: served from the mock store via aoiApi until the backend exists.
 * (The real API path lives in src/api/client.ts — swap fetchAOIsFromApi for
 * withRetry(getAOIs) when a GET /aois endpoint is available.)
 */
export function fetchAOIs(): Promise<AOI[]> {
  return fetchAOIsFromApi()
}

export interface AOIQueryResult {
  data: AOI[] | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAOIData(fetcher: AOIFetcher = fetchAOIs): AOIQueryResult {
  const [data, setData] = useState<AOI[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  useEffect(() => {
    let cancelled = false
    // Cache + retry apply to the real API path only; injected fetchers (tests) stay deterministic.
    const useCache = fetcherRef.current === fetchAOIs

    if (useCache && attempt === 0) {
      const cached = getCached<AOI[]>(CACHE_KEY)
      if (cached) {
        setData(cached)
        setIsLoading(false)
        setError(null)
        return
      }
    }

    setIsLoading(true)
    setError(null)

    fetcherRef
      .current()
      .then((result) => {
        if (cancelled) return
        setData(result)
        if (useCache) setCached(CACHE_KEY, result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load AOIs')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const refetch = useCallback(() => setAttempt((n) => n + 1), [])

  return { data, isLoading, error, refetch }
}
