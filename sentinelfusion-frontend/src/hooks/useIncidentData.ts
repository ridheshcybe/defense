import { useCallback, useEffect, useRef, useState } from 'react'
import type { Incident } from '../types'
import { fetchIncidents as fetchIncidentsFromApi } from '../api/incidentApi'
import { getCached, setCached } from '../api/cache'

export type IncidentFetcher = (aoiId: string | null) => Promise<Incident[]>

const cacheKey = (aoiId: string | null) => `incidents:${aoiId ?? 'all'}`

/**
 * Default fetcher: served from the mock store via incidentApi until the backend exists.
 * (The real API path lives in src/api/client.ts — swap fetchIncidentsFromApi for
 * withRetry(getIncidents) when a GET /incidents endpoint is available.)
 */
export function fetchIncidents(aoiId: string | null): Promise<Incident[]> {
  return fetchIncidentsFromApi(aoiId)
}

export interface IncidentQueryResult {
  data: Incident[] | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useIncidentData(
  aoiId: string | null,
  fetcher: IncidentFetcher = fetchIncidents,
): IncidentQueryResult {
  const [data, setData] = useState<Incident[] | null>(null)
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
    const useCache = fetcherRef.current === fetchIncidents

    if (useCache && attempt === 0) {
      const cached = getCached<Incident[]>(cacheKey(aoiId))
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
      .current(aoiId)
      .then((result) => {
        if (cancelled) return
        setData(result)
        if (useCache) setCached(cacheKey(aoiId), result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load incidents')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [aoiId, attempt])

  const refetch = useCallback(() => setAttempt((n) => n + 1), [])

  return { data, isLoading, error, refetch }
}
