import { useCallback, useEffect, useState } from 'react'
import { fetchLeadershipData } from '../api/leadershipApi'
import type { DateRange, LeadershipData } from '../types'

/**
 * Loads aggregated leadership data for a date range. Mirrors useAOIData:
 * a fetcher can be injected for tests, otherwise it hits the mock leadershipApi.
 */
export function useLeadershipData(
  range: DateRange,
  fetcher: (range: DateRange) => Promise<LeadershipData> = fetchLeadershipData,
) {
  const [data, setData] = useState<LeadershipData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher(range)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leadership data')
    } finally {
      setIsLoading(false)
    }
  }, [range, fetcher])

  useEffect(() => {
    void load()
  }, [load])

  const refetch = useCallback(() => {
    void load()
  }, [load])

  return { data, isLoading, error, refetch }
}
