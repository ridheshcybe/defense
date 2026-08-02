import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, getAOIs, getIncidentById, getIncidents, withRetry } from '../api/client'

function mockResponse(overrides: Partial<{ ok: boolean; status: number; json: unknown }>) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: overrides.ok ?? true,
      status: overrides.status ?? 200,
      json: async () => overrides.json ?? {},
    }),
  )
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe('apiRequest', () => {
  it('sends Authorization and Content-Type headers and unwraps ApiResponse', async () => {
    mockResponse({ json: { data: [{ id: 'aoi-1' }] } })
    const result = await apiRequest<Array<{ id: string }>>('/aois')
    expect(result).toEqual([{ id: 'aoi-1' }])
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://tokenrouter.me/v1/aois',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: expect.stringMatching(/^Bearer /),
        }),
      }),
    )
  })

  it('prefers the signed-in session token over the API key', async () => {
    window.localStorage.setItem('sf.token', 'session-jwt')
    mockResponse({ json: { data: [] } })
    await apiRequest('/aois')
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer session-jwt' }),
      }),
    )
  })

  it('returns the body directly when it is not wrapped in ApiResponse', async () => {
    mockResponse({ json: { id: 'inc-1' } })
    await expect(apiRequest<{ id: string }>('/incidents/inc-1')).resolves.toEqual({ id: 'inc-1' })
  })

  it('maps 401 to an auth error message', async () => {
    mockResponse({ ok: false, status: 401 })
    await expect(apiRequest('/aois')).rejects.toThrow('Authentication failed. Please log in again.')
  })

  it('maps 403 to an auth error message', async () => {
    mockResponse({ ok: false, status: 403 })
    await expect(apiRequest('/aois')).rejects.toThrow('Authentication failed. Please log in again.')
  })

  it('maps 404 to a not-found error message', async () => {
    mockResponse({ ok: false, status: 404 })
    await expect(apiRequest('/aois')).rejects.toThrow('Data not found.')
  })

  it('maps 500 to a server error message', async () => {
    mockResponse({ ok: false, status: 500 })
    await expect(apiRequest('/aois')).rejects.toThrow('Server error. Please try again later.')
  })

  it('maps unmapped statuses to a generic message', async () => {
    mockResponse({ ok: false, status: 418 })
    await expect(apiRequest('/aois')).rejects.toThrow('Something went wrong. Please try again.')
  })

  it('wraps network failures as a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(apiRequest('/aois')).rejects.toThrow(
      'Unable to connect to server. Check your connection.',
    )
  })

  it('aborts the request after the 10s timeout', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const promise = apiRequest('/aois')
    const rejection = expect(promise).rejects.toThrow(
      'Unable to connect to server. Check your connection.',
    )
    await vi.advanceTimersByTimeAsync(10_000)
    await rejection
    expect(fetchMock).toHaveBeenCalled()
  })
})

describe('endpoint helpers', () => {
  it('getAOIs hits /aois', async () => {
    mockResponse({ json: { data: [] } })
    await getAOIs()
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/aois'),
      expect.anything(),
    )
  })

  it('getIncidents without aoiId hits /incidents', async () => {
    mockResponse({ json: { data: [] } })
    await getIncidents()
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/incidents'),
      expect.anything(),
    )
  })

  it('getIncidents with aoiId appends the query param', async () => {
    mockResponse({ json: { data: [] } })
    await getIncidents('aoi-1')
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/incidents?aoiId=aoi-1'),
      expect.anything(),
    )
  })

  it('getIncidentById hits the single-resource endpoint', async () => {
    mockResponse({ json: { data: { id: 'inc-1' } } })
    await getIncidentById('inc-1')
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/inc-1'),
      expect.anything(),
    )
  })
})

describe('withRetry', () => {
  it('resolves on the first attempt when there is no failure', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    await expect(withRetry(fn, 2, [1_000, 2_000])).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries up to the limit and then resolves', async () => {
    vi.useFakeTimers()
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok')
    const promise = withRetry(fn, 2, [1_000, 2_000])
    const result = promise.then(
      (value) => value,
      (err) => err,
    )
    await vi.advanceTimersByTimeAsync(3000)
    await expect(result).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting all retries', async () => {
    vi.useFakeTimers()
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    const promise = withRetry(fn, 2, [1_000, 2_000])
    const rejection = expect(promise).rejects.toThrow('boom')
    await vi.advanceTimersByTimeAsync(3000)
    await rejection
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
