import { useCallback, useEffect, useState } from 'react'
import { fetchIncidentQueue } from '../api/fieldOpsApi'
import type { Incident } from '../types'

/**
 * Loads the field-ops work queue for a user. Mirrors useAOIData: a fetcher can
 * be injected for tests, otherwise it hits the mock fieldOpsApi.
 */
export function useFieldOpsData(
  userId: string,
  fetcher: (userId: string) => Promise<Incident[]> = fetchIncidentQueue,
) {
  const [data, setData] = useState<Incident[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher(userId)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents')
    } finally {
      setIsLoading(false)
    }
  }, [userId, fetcher])

  useEffect(() => {
    void load()
  }, [load])

  const refetch = useCallback(() => {
    void load()
  }, [load])

  return { data, isLoading, error, refetch }
}
