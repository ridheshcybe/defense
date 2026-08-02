import { apiRequest } from './client'
import type { AIPrediction } from '../types'

// Note: apiRequest attaches an Authorization header (session JWT or API key).
// The local AI server ignores it (no auth required), so this is harmless in
// the demo — but worth remembering if the AI server ever starts validating it.

// The multimodal AI pipeline runs as a separate FastAPI service
// (ai/model_server.py, `uvicorn ai.model_server:app --port 8000`). Point
// VITE_AI_API_BASE at it when deployed elsewhere; default is local dev.
const AI_API_BASE: string = import.meta.env.VITE_AI_API_BASE ?? 'http://localhost:8000'

// Tiny valid 1x1 transparent PNG — a stand-in satellite/webcam frame until real
// imagery capture is wired up. The pipeline decodes and resizes it.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** Deterministic PRNG (mulberry32) so mock payloads are stable per AOI. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Builds mock satellite/webcam/CSI payloads for an AOI (deterministic per AOI). */
export function buildMockInferencePayload(aoiId: string) {
  const rand = mulberry32(hashString(aoiId))
  const csi = Array.from({ length: 3 }, () =>
    Array.from({ length: 128 }, () => Math.round((rand() * 2 - 1) * 100) / 100),
  )
  return {
    satellite: TINY_PNG_BASE64,
    webcam: [TINY_PNG_BASE64, TINY_PNG_BASE64, TINY_PNG_BASE64],
    csi,
  }
}

/**
 * Runs the multimodal AI pipeline for an AOI and returns the predicted
 * incident. Sends mock satellite/webcam/CSI payloads for now; swap for real
 * imagery when the capture pipeline lands.
 */
export async function runAOPrediction(aoiId: string): Promise<AIPrediction> {
  const payload = buildMockInferencePayload(aoiId)
  return apiRequest<AIPrediction>(
    '/api/inference/predict',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    AI_API_BASE,
  )
}
