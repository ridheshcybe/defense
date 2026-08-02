import { MOCK_AOIS } from '../data/mockData'
import type { AOI, CreateAOIDTO, UpdateAOIDTO } from '../types'

const SIMULATED_DELAY_MS = 500

// In-memory store seeded from mock data so CRUD works against a stable list.
// Swap the bodies for real fetch (POST/PUT/DELETE /aois) when the backend exists.
let aoiStore: AOI[] = [...MOCK_AOIS]
let idCounter = 100

async function simulate<T>(producer: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))
  return producer()
}

function boxFromCenter(center: AOI['center']): AOI['geometry'] {
  const d = 0.015
  return [
    { lat: center.lat - d, lng: center.lng - d },
    { lat: center.lat + d, lng: center.lng - d },
    { lat: center.lat + d, lng: center.lng + d },
    { lat: center.lat - d, lng: center.lng + d },
  ]
}

/**
 * Read path returns the in-memory store (mock) for now — keeps create/edit/delete
 * consistent and the feature usable before a real GET /aois endpoint exists.
 * Swap for `getAOIs()` (TokenRouter client) when the backend lands.
 */
export async function fetchAOIs(): Promise<AOI[]> {
  return [...aoiStore]
}

export async function createAOI(data: CreateAOIDTO): Promise<AOI> {
  return simulate(() => {
    const aoi: AOI = {
      id: `aoi-${++idCounter}`,
      name: data.name,
      status: 'monitoring',
      tier: 3,
      center: data.center,
      geometry: boxFromCenter(data.center),
      lastUpdated: 'just now',
      incidentCount: 0,
      description: data.description,
      tags: data.tags,
    }
    aoiStore = [aoi, ...aoiStore]
    return aoi
  })
}

export async function updateAOI(id: string, data: UpdateAOIDTO): Promise<AOI> {
  return simulate(() => {
    const index = aoiStore.findIndex((aoi) => aoi.id === id)
    if (index === -1) throw new Error('AOI not found')
    const updated: AOI = { ...aoiStore[index], ...data, lastUpdated: 'just now' }
    aoiStore = aoiStore.map((aoi) => (aoi.id === id ? updated : aoi))
    return updated
  })
}

export async function deleteAOI(id: string): Promise<void> {
  return simulate(() => {
    aoiStore = aoiStore.filter((aoi) => aoi.id !== id)
  })
}

/** Test helper: resets the in-memory store to the original mock seed. */
export function resetAOIStore(): void {
  aoiStore = [...MOCK_AOIS]
  idCounter = 100
}
