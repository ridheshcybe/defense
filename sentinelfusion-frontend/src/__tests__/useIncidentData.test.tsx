import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { fetchIncidents, useIncidentData } from '../hooks/useIncidentData'
import { clearCache, setCached } from '../api/cache'
import { resetIncidentStore } from '../api/incidentApi'
import { MOCK_INCIDENTS } from '../data/mockData'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  clearCache()
  resetIncidentStore()
})

describe('useIncidentData', () => {
  it('returns all incidents when aoiId is null', async () => {
    const fetcher = vi.fn().mockResolvedValue(MOCK_INCIDENTS)
    const { result } = renderHook(() => useIncidentData(null, fetcher))
    await waitFor(() => expect(result.current.data).toEqual(MOCK_INCIDENTS))
    expect(fetcher).toHaveBeenCalledWith(null)
  })

  it('passes the aoiId to the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue([MOCK_INCIDENTS[0]])
    const { result } = renderHook(() => useIncidentData('aoi-1', fetcher))
    await waitFor(() => expect(result.current.data).toEqual([MOCK_INCIDENTS[0]]))
    expect(fetcher).toHaveBeenCalledWith('aoi-1')
  })

  it('returns error state when the fetcher fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Failed to load incidents'))
    const { result } = renderHook(() => useIncidentData(null, fetcher))
    await waitFor(() => expect(result.current.error).toBe('Failed to load incidents'))
    expect(result.current.isLoading).toBe(false)
  })

  it('fetchIncidents serves the mock store scoped to aoiId without hitting the network', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Network request failed'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchIncidents('aoi-1')).resolves.toEqual(
      MOCK_INCIDENTS.filter((incident) => incident.aoiId === 'aoi-1'),
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetchIncidents returns all incidents when aoiId is null', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Network request failed'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchIncidents(null)).resolves.toEqual(MOCK_INCIDENTS)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('hydrates from the per-aoiId cache without calling the API when data is fresh', () => {
    setCached('incidents:aoi-1', [MOCK_INCIDENTS[0]])
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) })
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useIncidentData('aoi-1'))
    expect(result.current.data).toEqual([MOCK_INCIDENTS[0]])
    expect(result.current.isLoading).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
