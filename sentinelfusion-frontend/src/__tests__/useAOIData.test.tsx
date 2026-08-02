import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { fetchAOIs, useAOIData } from '../hooks/useAOIData'
import { clearCache, setCached } from '../api/cache'
import { resetAOIStore } from '../api/aoiApi'
import { MOCK_AOIS } from '../data/mockData'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  clearCache()
  resetAOIStore()
})

describe('useAOIData', () => {
  it('returns loading state initially', () => {
    const fetcher = vi.fn(() => new Promise<typeof MOCK_AOIS>(() => {}))
    const { result } = renderHook(() => useAOIData(fetcher))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('returns data after the fetcher resolves', async () => {
    const fetcher = vi.fn().mockResolvedValue(MOCK_AOIS)
    const { result } = renderHook(() => useAOIData(fetcher))
    await waitFor(() => expect(result.current.data).toEqual(MOCK_AOIS))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns error state when the fetcher fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Failed to load AOIs'))
    const { result } = renderHook(() => useAOIData(fetcher))
    await waitFor(() => expect(result.current.error).toBe('Failed to load AOIs'))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeNull()
  })

  it('refetches when refetch is called', async () => {
    const fetcher = vi.fn().mockResolvedValue(MOCK_AOIS)
    const { result } = renderHook(() => useAOIData(fetcher))
    await waitFor(() => expect(result.current.data).toEqual(MOCK_AOIS))
    expect(fetcher).toHaveBeenCalledTimes(1)
    result.current.refetch()
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  })

  it('fetchAOIs serves the mock store without hitting the network', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Network request failed'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchAOIs()).resolves.toEqual(MOCK_AOIS)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('hydrates from the cache without calling the API when data is fresh', () => {
    setCached('aois', MOCK_AOIS)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) })
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useAOIData())
    expect(result.current.data).toEqual(MOCK_AOIS)
    expect(result.current.isLoading).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches from the store when the cache is empty', async () => {
    const { result } = renderHook(() => useAOIData())
    await waitFor(() => expect(result.current.data).toEqual(MOCK_AOIS))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
