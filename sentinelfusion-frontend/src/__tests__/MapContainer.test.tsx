import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { DEFAULT_VIEW, MapContainer } from '../components/map/MapContainer'
import type { AnalystContextValue } from '../contexts/AnalystContext'
import { AnalystContext } from '../contexts/AnalystContext'
import { createAnalystValue, renderWithAnalyst } from '../test/testUtils'
import { MOCK_AOIS, MOCK_INCIDENTS, MOCK_ZONES } from '../data/mockData'

const mapInstance = vi.hoisted(() => ({
  flyTo: vi.fn(),
  fitBounds: vi.fn(),
  getContainer: vi.fn(() => document.createElement('div')),
}))

const mapProps = vi.hoisted(() => ({
  center: null as unknown,
  zoom: null as number | null,
}))

vi.mock('react-leaflet', () => ({
  MapContainer: ({
    center,
    zoom,
    children,
  }: {
    center: unknown
    zoom?: number
    children: ReactNode
  }) => {
    mapProps.center = center
    mapProps.zoom = zoom ?? null
    return <div data-testid="leaflet-map">{children}</div>
  },
  TileLayer: () => <div data-testid="tile-layer" />,
  Polygon: ({ eventHandlers }: { eventHandlers?: { click?: () => void } }) => (
    <button type="button" data-testid="map-polygon" onClick={eventHandlers?.click}>
      polygon
    </button>
  ),
  Marker: ({
    eventHandlers,
    children,
  }: {
    eventHandlers?: { click?: () => void }
    children?: ReactNode
  }) => (
    <button type="button" data-testid="incident-marker" onClick={eventHandlers?.click}>
      {children}
    </button>
  ),
  Tooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useMap: () => mapInstance,
}))

function renderMap(overrides: Partial<AnalystContextValue> = {}) {
  return renderWithAnalyst(<MapContainer />, {
    aois: MOCK_AOIS,
    incidents: MOCK_INCIDENTS,
    zones: MOCK_ZONES,
    ...overrides,
  })
}

describe('MapContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a leaflet map centered on India at zoom 6', () => {
    renderMap()
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument()
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
    expect(mapProps.center).toEqual([DEFAULT_VIEW.lat, DEFAULT_VIEW.lng])
    expect(mapProps.zoom).toBe(DEFAULT_VIEW.zoom)
  })

  it('renders AOI polygons (and zone polygons) when aois are provided', () => {
    renderMap()
    expect(screen.getAllByTestId('map-polygon')).toHaveLength(
      MOCK_AOIS.length + MOCK_ZONES.length,
    )
  })

  it('renders incident markers for all incidents when no AOI is selected', () => {
    renderMap()
    const markers = screen.getAllByTestId('incident-marker')
    expect(markers).toHaveLength(MOCK_INCIDENTS.length)
    // Popup content (type / severity / description) renders inside each marker
    expect(markers[0]).toHaveTextContent('Threat')
  })

  it('calls onSelectAOI when an AOI polygon is clicked', () => {
    const selectAOI = vi.fn()
    renderMap({ selectAOI })
    fireEvent.click(screen.getAllByTestId('map-polygon')[0])
    expect(selectAOI).toHaveBeenCalledWith(MOCK_AOIS[0])
  })

  it('calls onSelectIncident when an incident marker is clicked', () => {
    const selectIncident = vi.fn()
    renderMap({ selectIncident })
    fireEvent.click(screen.getAllByTestId('incident-marker')[0])
    expect(selectIncident).toHaveBeenCalledWith(MOCK_INCIDENTS[0])
  })

  it('flies to the AOI center when selectedAOI changes', () => {
    const { rerender } = render(
      <AnalystContext.Provider
        value={createAnalystValue({
          aois: MOCK_AOIS,
          incidents: MOCK_INCIDENTS,
          zones: MOCK_ZONES,
        })}
      >
        <MapContainer />
      </AnalystContext.Provider>,
    )
    expect(mapInstance.flyTo).not.toHaveBeenCalled()
    rerender(
      <AnalystContext.Provider
        value={createAnalystValue({
          aois: MOCK_AOIS,
          incidents: MOCK_INCIDENTS,
          zones: MOCK_ZONES,
          selectedAOI: MOCK_AOIS[0],
        })}
      >
        <MapContainer />
      </AnalystContext.Provider>,
    )
    expect(mapInstance.flyTo).toHaveBeenCalledWith(
      [MOCK_AOIS[0].center.lat, MOCK_AOIS[0].center.lng],
      12,
      expect.anything(),
    )
  })

  it('resets the view via the Reset view button', () => {
    renderMap()
    fireEvent.click(screen.getByRole('button', { name: /reset view/i }))
    expect(mapInstance.flyTo).toHaveBeenCalledWith(
      [DEFAULT_VIEW.lat, DEFAULT_VIEW.lng],
      DEFAULT_VIEW.zoom,
      expect.anything(),
    )
  })

  it('fits bounds via the Fit to AOI button', () => {
    renderMap({ selectedAOI: MOCK_AOIS[0] })
    fireEvent.click(screen.getByRole('button', { name: /fit to aoi/i }))
    expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1)
  })

  it('toggles layers via the AOIs and Incidents chips', () => {
    renderMap()
    expect(screen.getAllByTestId('map-polygon')).toHaveLength(
      MOCK_AOIS.length + MOCK_ZONES.length,
    )
    fireEvent.click(screen.getByRole('button', { name: 'AOIs' }))
    expect(screen.getAllByTestId('map-polygon')).toHaveLength(MOCK_ZONES.length)
    fireEvent.click(screen.getByRole('button', { name: 'Incidents' }))
    expect(screen.queryByTestId('incident-marker')).not.toBeInTheDocument()
  })

  it('shows the selected AOI name in the header chip', () => {
    renderMap({ selectedAOI: MOCK_AOIS[0] })
    expect(screen.getByText('Selected: Mumbai Central')).toBeInTheDocument()
  })

  it('shows a spinner while loading', () => {
    renderMap({ aois: [], incidents: [], zones: [], isLoading: true })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows an error alert and retries via refetch', () => {
    const refetch = vi.fn()
    renderMap({ aois: [], incidents: [], zones: [], error: 'Failed to load AOIs', refetch })
    expect(screen.getByText('Failed to load AOIs')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalled()
  })
})
