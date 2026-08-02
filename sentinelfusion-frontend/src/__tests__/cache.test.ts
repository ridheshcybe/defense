import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearCache, getCached, setCached } from '../api/cache'

afterEach(() => {
  clearCache()
  vi.useRealTimers()
})

describe('cache', () => {
  it('stores and retrieves values within the TTL', () => {
    setCached('aois', [{ id: 'aoi-1' }])
    expect(getCached('aois')).toEqual([{ id: 'aoi-1' }])
  })

  it('returns undefined for a missing key', () => {
    expect(getCached('nope')).toBeUndefined()
  })

  it('expires entries older than 5 minutes', () => {
    vi.useFakeTimers()
    setCached('aois', [{ id: 'aoi-1' }])
    vi.advanceTimersByTime(5 * 60 * 1000 + 1)
    expect(getCached('aois')).toBeUndefined()
  })

  it('honours a custom TTL', () => {
    vi.useFakeTimers()
    setCached('short', [{ id: 'aoi-1' }])
    setCached('long', [{ id: 'aoi-2' }])
    vi.advanceTimersByTime(10_000)
    expect(getCached('short', 5_000)).toBeUndefined()
    expect(getCached('long', 60_000)).toEqual([{ id: 'aoi-2' }])
  })

  it('clearCache empties the store', () => {
    setCached('aois', [{ id: 'aoi-1' }])
    clearCache()
    expect(getCached('aois')).toBeUndefined()
  })
})
