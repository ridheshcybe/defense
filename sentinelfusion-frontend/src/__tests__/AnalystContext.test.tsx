import { describe, expect, it, vi } from 'vitest'
import { render, renderHook, screen, waitFor } from '@testing-library/react'
import { AnalystProvider, useAnalyst } from '../contexts/AnalystContext'
import { MOCK_AOIS, MOCK_INCIDENTS } from '../data/mockData'
import type { AOI } from '../types'

// Mock the AOI + incident CRUD APIs so context tests are fast and deterministic.
const { createAOI, updateAOI, deleteAOI } = vi.hoisted(() => ({
  createAOI: vi.fn(),
  updateAOI: vi.fn(),
  deleteAOI: vi.fn(),
}))

vi.mock('../api/aoiApi', () => ({
  createAOI,
  updateAOI,
  deleteAOI,
}))

const {
  createIncident,
  updateIncident,
  updateIncidentStatus,
  assignIncident,
  deleteIncident,
} = vi.hoisted(() => ({
  createIncident: vi.fn(),
  updateIncident: vi.fn(),
  updateIncidentStatus: vi.fn(),
  assignIncident: vi.fn(),
  deleteIncident: vi.fn(),
}))

vi.mock('../api/incidentApi', () => ({
  createIncident,
  updateIncident,
  updateIncidentStatus,
  assignIncident,
  deleteIncident,
  // Safe default so an uninjected default fetcher resolves to [] instead of undefined.
  fetchIncidents: vi.fn().mockResolvedValue([]),
}))

function Probe() {
  const {
    aois,
    incidents,
    isLoading,
    selectedAOI,
    filterAOIs,
    filterIncidents,
    selectAOI,
  } = useAnalyst()
  return (
    <div>
      <span data-testid="aois">{aois.length}</span>
      <span data-testid="incidents">{incidents.length}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="selected">{selectedAOI?.id ?? 'none'}</span>
      <span data-testid="filtered-aois">{filterAOIs('bandra').length}</span>
      <span data-testid="filtered-incidents">{filterIncidents('aoi-1').length}</span>
      <button type="button" onClick={() => selectAOI(MOCK_AOIS[0])}>
        select aoi
      </button>
    </div>
  )
}

describe('AnalystContext', () => {
  it('throws when useAnalyst is used outside the provider', () => {
    expect(() => renderHook(() => useAnalyst())).toThrow(
      'useAnalyst must be used within an AnalystProvider',
    )
  })

  it('provides loaded data and filter helpers', async () => {
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <Probe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('aois')).toHaveTextContent('5'))
    expect(screen.getByTestId('incidents')).toHaveTextContent('8')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('filtered-aois')).toHaveTextContent('1')
    expect(screen.getByTestId('filtered-incidents')).toHaveTextContent('3')
  })

  it('selects an AOI and exposes it via context', async () => {
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <Probe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('aois')).toHaveTextContent('5'))
    screen.getByRole('button', { name: 'select aoi' }).click()
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('aoi-1'))
  })

  it('runs a natural-language query against incidents', async () => {
    function QueryProbe() {
      const { runQuery } = useAnalyst()
      return <span data-testid="query-results">{runQuery('terrorist').length}</span>
    }
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <QueryProbe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('query-results')).toHaveTextContent('2'))
  })

  it('setTriage updates the incident triage label', async () => {
    function TriageProbe() {
      const { incidents, setTriage } = useAnalyst()
      const incident = incidents.find((item) => item.id === 'inc-1')
      return (
        <div>
          <span data-testid="triage">{incident?.triageLabel ?? 'none'}</span>
          <button type="button" onClick={() => setTriage('inc-1', 'watch')}>
            set triage
          </button>
        </div>
      )
    }
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <TriageProbe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('triage')).toHaveTextContent('escalate'))
    screen.getByRole('button', { name: 'set triage' }).click()
    await waitFor(() => expect(screen.getByTestId('triage')).toHaveTextContent('watch'))
  })

  it('exposes a refetch function', async () => {
    const aoiFetcher = vi.fn().mockResolvedValue(MOCK_AOIS)
    const incidentFetcher = vi.fn().mockResolvedValue(MOCK_INCIDENTS)
    function RefetchProbe() {
      const { refetch } = useAnalyst()
      return (
        <button type="button" onClick={refetch}>
          refetch
        </button>
      )
    }
    render(
      <AnalystProvider aoiFetcher={aoiFetcher} incidentFetcher={incidentFetcher}>
        <RefetchProbe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(aoiFetcher).toHaveBeenCalledTimes(1))
    screen.getByRole('button', { name: 'refetch' }).click()
    await waitFor(() => expect(aoiFetcher).toHaveBeenCalledTimes(2))
    expect(incidentFetcher).toHaveBeenCalledTimes(2)
  })

  it('createAOI adds the AOI to the list and shows a success toast', async () => {
    const created: AOI = {
      id: 'aoi-new',
      name: 'New Site',
      status: 'monitoring',
      tier: 3,
      center: { lat: 1, lng: 2 },
      geometry: [],
      lastUpdated: 'just now',
      incidentCount: 0,
      tags: [],
    }
    createAOI.mockResolvedValue(created)
    function CrudProbe() {
      const { aois, toast, createAOI } = useAnalyst()
      return (
        <div>
          <span data-testid="crud-aois">{aois.length}</span>
          <span data-testid="crud-toast">{toast?.message ?? 'none'}</span>
          <button
            type="button"
            onClick={() => createAOI({ name: 'New Site', center: { lat: 1, lng: 2 }, tags: [] })}
          >
            create aoi
          </button>
        </div>
      )
    }
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <CrudProbe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('crud-aois')).toHaveTextContent('5'))
    screen.getByRole('button', { name: 'create aoi' }).click()
    await waitFor(() => expect(screen.getByTestId('crud-aois')).toHaveTextContent('6'))
    await waitFor(() => expect(screen.getByTestId('crud-toast')).toHaveTextContent('New Site'))
  })

  it('updateAOI replaces the AOI and shows a toast', async () => {
    updateAOI.mockResolvedValue({ ...MOCK_AOIS[0], name: 'Renamed Hub' })
    function UpdateProbe() {
      const { aois, toast, updateAOI } = useAnalyst()
      const first = aois[0]
      return (
        <div>
          <span data-testid="first-aoi">{first?.name ?? 'none'}</span>
          <span data-testid="update-toast">{toast?.message ?? 'none'}</span>
          <button type="button" onClick={() => updateAOI('aoi-1', { name: 'Renamed Hub' })}>
            update aoi
          </button>
        </div>
      )
    }
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <UpdateProbe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('first-aoi')).toHaveTextContent('Mumbai Central'))
    screen.getByRole('button', { name: 'update aoi' }).click()
    await waitFor(() => expect(screen.getByTestId('first-aoi')).toHaveTextContent('Renamed Hub'))
    await waitFor(() => expect(screen.getByTestId('update-toast')).toHaveTextContent('updated'))
  })

  it('deleteAOI removes the AOI, clears selection, and shows a toast', async () => {
    deleteAOI.mockResolvedValue(undefined)
    function DeleteProbe() {
      const { aois, selectedAOI, toast, deleteAOI, selectAOI } = useAnalyst()
      return (
        <div>
          <span data-testid="delete-count">{aois.length}</span>
          <span data-testid="delete-selected">{selectedAOI?.id ?? 'none'}</span>
          <span data-testid="delete-toast">{toast?.message ?? 'none'}</span>
          <button type="button" onClick={() => selectAOI(MOCK_AOIS[0])}>
            select first
          </button>
          <button type="button" onClick={() => deleteAOI('aoi-1')}>
            delete aoi
          </button>
        </div>
      )
    }
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <DeleteProbe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('delete-count')).toHaveTextContent('5'))
    screen.getByRole('button', { name: 'select first' }).click()
    await waitFor(() => expect(screen.getByTestId('delete-selected')).toHaveTextContent('aoi-1'))
    screen.getByRole('button', { name: 'delete aoi' }).click()
    await waitFor(() => expect(screen.getByTestId('delete-count')).toHaveTextContent('4'))
    await waitFor(() => expect(screen.getByTestId('delete-selected')).toHaveTextContent('none'))
    await waitFor(() => expect(screen.getByTestId('delete-toast')).toHaveTextContent('deleted'))
  })

  it('createIncident adds the incident to the list and shows a success toast', async () => {
    createIncident.mockResolvedValue({ ...MOCK_INCIDENTS[0], id: 'inc-new' })
    function Probe() {
      const { incidents, toast, createIncident } = useAnalyst()
      return (
        <div>
          <span data-testid="crud-incidents">{incidents.length}</span>
          <span data-testid="crud-incident-toast">{toast?.message ?? 'none'}</span>
          <button
            type="button"
            onClick={() =>
              createIncident({
                type: 'threat',
                severity: 'critical',
                location: { lat: 1, lng: 2 },
                description: 'Test incident',
                aoiId: 'aoi-1',
                tags: [],
              })
            }
          >
            create incident
          </button>
        </div>
      )
    }
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <Probe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('crud-incidents')).toHaveTextContent('8'))
    screen.getByRole('button', { name: 'create incident' }).click()
    await waitFor(() => expect(screen.getByTestId('crud-incidents')).toHaveTextContent('9'))
    await waitFor(() =>
      expect(screen.getByTestId('crud-incident-toast')).toHaveTextContent('Incident created'),
    )
  })

  it('updateIncident replaces the incident and shows a toast', async () => {
    updateIncident.mockResolvedValue({ ...MOCK_INCIDENTS[0], description: 'Updated description' })
    function Probe() {
      const { incidents, toast, updateIncident } = useAnalyst()
      const incident = incidents.find((i) => i.id === 'inc-1')
      return (
        <div>
          <span data-testid="incident-desc">{incident?.description ?? 'none'}</span>
          <span data-testid="incident-update-toast">{toast?.message ?? 'none'}</span>
          <button
            type="button"
            onClick={() => updateIncident('inc-1', { description: 'Updated description' })}
          >
            update incident
          </button>
        </div>
      )
    }
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <Probe />
      </AnalystProvider>,
    )
    await waitFor(() =>
      expect(screen.getByTestId('incident-desc')).toHaveTextContent(/Armed individuals/),
    )
    screen.getByRole('button', { name: 'update incident' }).click()
    await waitFor(() =>
      expect(screen.getByTestId('incident-desc')).toHaveTextContent('Updated description'),
    )
    await waitFor(() =>
      expect(screen.getByTestId('incident-update-toast')).toHaveTextContent('Incident updated'),
    )
  })

  it('updateIncidentStatus updates the status and shows a toast', async () => {
    updateIncidentStatus.mockResolvedValue({ ...MOCK_INCIDENTS[0], status: 'resolved' })
    function Probe() {
      const { incidents, toast, updateIncidentStatus } = useAnalyst()
      const incident = incidents.find((i) => i.id === 'inc-1')
      return (
        <div>
          <span data-testid="incident-status">{incident?.status ?? 'none'}</span>
          <span data-testid="status-toast">{toast?.message ?? 'none'}</span>
          <button type="button" onClick={() => updateIncidentStatus('inc-1', 'resolved')}>
            set status
          </button>
        </div>
      )
    }
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <Probe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('incident-status')).toHaveTextContent('open'))
    screen.getByRole('button', { name: 'set status' }).click()
    await waitFor(() => expect(screen.getByTestId('incident-status')).toHaveTextContent('resolved'))
    await waitFor(() =>
      expect(screen.getByTestId('status-toast')).toHaveTextContent('Incident status updated'),
    )
  })

  it('assignIncident sets the assigned user and shows a toast', async () => {
    assignIncident.mockResolvedValue({ ...MOCK_INCIDENTS[0], assignedTo: 'user-1' })
    function Probe() {
      const { incidents, toast, assignIncident } = useAnalyst()
      const incident = incidents.find((i) => i.id === 'inc-1')
      return (
        <div>
          <span data-testid="assign-count">{incidents.length}</span>
          <span data-testid="incident-assigned">{incident?.assignedTo ?? 'none'}</span>
          <span data-testid="assign-toast">{toast?.message ?? 'none'}</span>
          <button type="button" onClick={() => assignIncident('inc-1', 'user-1')}>
            assign incident
          </button>
        </div>
      )
    }
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <Probe />
      </AnalystProvider>,
    )
    // Wait for the provider to finish loading before interacting — 'none' alone would match
    // the not-yet-loaded state too, letting the click race the hydration sync effect.
    await waitFor(() => expect(screen.getByTestId('assign-count')).toHaveTextContent('8'))
    screen.getByRole('button', { name: 'assign incident' }).click()
    await waitFor(() => expect(screen.getByTestId('incident-assigned')).toHaveTextContent('user-1'))
    await waitFor(() =>
      expect(screen.getByTestId('assign-toast')).toHaveTextContent('Incident assigned'),
    )
  })

  it('deleteIncident removes the incident, clears selection, and shows a toast', async () => {
    deleteIncident.mockResolvedValue(undefined)
    function Probe() {
      const { incidents, selectedIncident, toast, deleteIncident, selectIncident } = useAnalyst()
      return (
        <div>
          <span data-testid="delete-incident-count">{incidents.length}</span>
          <span data-testid="delete-incident-selected">{selectedIncident?.id ?? 'none'}</span>
          <span data-testid="delete-incident-toast">{toast?.message ?? 'none'}</span>
          <button type="button" onClick={() => selectIncident(MOCK_INCIDENTS[0])}>
            select first incident
          </button>
          <button type="button" onClick={() => deleteIncident('inc-1')}>
            delete incident
          </button>
        </div>
      )
    }
    render(
      <AnalystProvider
        aoiFetcher={() => Promise.resolve(MOCK_AOIS)}
        incidentFetcher={() => Promise.resolve(MOCK_INCIDENTS)}
      >
        <Probe />
      </AnalystProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('delete-incident-count')).toHaveTextContent('8'))
    screen.getByRole('button', { name: 'select first incident' }).click()
    await waitFor(() =>
      expect(screen.getByTestId('delete-incident-selected')).toHaveTextContent('inc-1'),
    )
    screen.getByRole('button', { name: 'delete incident' }).click()
    await waitFor(() => expect(screen.getByTestId('delete-incident-count')).toHaveTextContent('7'))
    await waitFor(() =>
      expect(screen.getByTestId('delete-incident-selected')).toHaveTextContent('none'),
    )
    await waitFor(() =>
      expect(screen.getByTestId('delete-incident-toast')).toHaveTextContent('Incident deleted'),
    )
  })
})
