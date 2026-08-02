import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildMockInferencePayload, runAOPrediction } from '../api/aiApi'

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
  vi.unstubAllGlobals()
  window.sessionStorage.clear()
})

describe('aiApi', () => {
  it('builds deterministic mock inference payloads per AOI', () => {
    const first = buildMockInferencePayload('aoi-1')
    const second = buildMockInferencePayload('aoi-1')
    const other = buildMockInferencePayload('aoi-2')
    expect(first).toEqual(second)
    // Deterministic but differs across AOIs (seeded by id).
    expect(first.csi).not.toEqual(other.csi)
    expect(first.satellite).toMatch(/^[A-Za-z0-9+/=]+$/)
    expect(first.webcam.length).toBeGreaterThan(0)
    expect(first.csi).toHaveLength(3)
    expect(first.csi[0]).toHaveLength(128)
  })

  it('POSTs mock payloads to the inference endpoint and maps the response', async () => {
    mockResponse({
      json: {
        incident_type: 'intrusion',
        severity: 'warning',
        confidence: 0.87,
        confidence_interval: [0.6, 0.95],
        latency_ms: 210.5,
      },
    })
    const result = await runAOPrediction('aoi-1')
    expect(result).toEqual({
      incident_type: 'intrusion',
      severity: 'warning',
      confidence: 0.87,
      confidence_interval: [0.6, 0.95],
      latency_ms: 210.5,
    })
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('http://localhost:8000/api/inference/predict')
    expect(init.method).toBe('POST')
    const body = JSON.parse(String(init.body))
    expect(body.satellite).toBeTruthy()
    expect(body.webcam.length).toBeGreaterThan(0)
    expect(Array.isArray(body.csi)).toBe(true)
  })

  it('propagates server errors', async () => {
    mockResponse({ ok: false, status: 500 })
    await expect(runAOPrediction('aoi-1')).rejects.toThrow(
      'Server error. Please try again later.',
    )
  })

  it('wraps network failures as a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(runAOPrediction('aoi-1')).rejects.toThrow(
      'Unable to connect to server. Check your connection.',
    )
  })
})
