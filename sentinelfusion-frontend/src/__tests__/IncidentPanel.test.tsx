import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { IncidentPanel } from '../components/incidents/IncidentPanel'
import { renderWithAnalyst } from '../test/testUtils'
import { MOCK_INCIDENTS } from '../data/mockData'

describe('IncidentPanel', () => {
  it('renders incident list with correct types', () => {
    renderWithAnalyst(<IncidentPanel />, { incidents: MOCK_INCIDENTS })
    expect(screen.getByText('Threat')).toBeInTheDocument()
    expect(screen.getAllByText('Protest')).toHaveLength(2)
    expect(screen.getByText('Drug Shipment')).toBeInTheDocument()
  })

  it('filters incidents by severity', async () => {
    renderWithAnalyst(<IncidentPanel />, { incidents: MOCK_INCIDENTS })
    fireEvent.mouseDown(screen.getByLabelText('Severity filter'))
    const option = await screen.findByRole('option', { name: 'Critical' })
    fireEvent.click(option)
    await waitFor(() => {
      expect(screen.queryByText('Protest')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Threat')).toBeInTheDocument()
  })

  it('shows incident details when incident is selected', () => {
    const selectedIncident = MOCK_INCIDENTS[0]
    renderWithAnalyst(<IncidentPanel />, { incidents: MOCK_INCIDENTS, selectedIncident })
    expect(screen.getByText(/Armed individuals gathering near the waterfront/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Incident status')).toBeInTheDocument()
    expect(screen.getByLabelText('Assigned to')).toBeInTheDocument()
    expect(screen.getByText(/Created 2026-08-01/)).toBeInTheDocument()
  })

  it('updates status via updateIncidentStatus when the status Select changes', async () => {
    const updateIncidentStatus = vi.fn().mockResolvedValue(undefined)
    renderWithAnalyst(<IncidentPanel />, {
      incidents: MOCK_INCIDENTS,
      selectedIncident: MOCK_INCIDENTS[0],
      updateIncidentStatus,
    })
    fireEvent.mouseDown(screen.getByLabelText('Incident status'))
    const option = await screen.findByRole('option', { name: 'Resolved' })
    fireEvent.click(option)
    expect(updateIncidentStatus).toHaveBeenCalledWith('inc-1', 'resolved')
  })

  it('shows the incident timeline for the selected incident', () => {
    const enriched = MOCK_INCIDENTS.find((incident) => incident.id === 'inc-2') ?? MOCK_INCIDENTS[0]
    renderWithAnalyst(<IncidentPanel />, { incidents: MOCK_INCIDENTS, selectedIncident: enriched })
    expect(screen.getByText('Incident created')).toBeInTheDocument()
    expect(screen.getByText(/Status changed/)).toBeInTheDocument()
    expect(screen.getByText('Assigned to Asha Nair')).toBeInTheDocument()
  })

  it('shows a Create Incident button', () => {
    renderWithAnalyst(<IncidentPanel />, { incidents: MOCK_INCIDENTS })
    expect(screen.getByRole('button', { name: /create incident/i })).toBeInTheDocument()
  })

  it('sorts incidents by timestamp (newest first)', () => {
    renderWithAnalyst(<IncidentPanel />, { incidents: MOCK_INCIDENTS })
    const items = screen.getAllByRole('button').filter((el) => el.textContent?.includes('2026-'))
    const first = items[0]?.textContent ?? ''
    expect(first).toContain('2026-08-01')
  })

  it('updates the triage label via setTriage when the dropdown changes', async () => {
    const setTriage = vi.fn()
    renderWithAnalyst(<IncidentPanel />, {
      incidents: MOCK_INCIDENTS,
      selectedIncident: MOCK_INCIDENTS[0],
      setTriage,
    })
    fireEvent.mouseDown(screen.getByLabelText('Triage label'))
    const option = await screen.findByRole('option', { name: 'Watch' })
    fireEvent.click(option)
    expect(setTriage).toHaveBeenCalledWith('inc-1', 'watch')
  })

  it('shows a spinner while loading', () => {
    renderWithAnalyst(<IncidentPanel />, { incidents: [], isLoading: true })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows an error alert and retries via refetch', () => {
    const refetch = vi.fn()
    renderWithAnalyst(<IncidentPanel />, {
      incidents: [],
      error: 'Failed to load incidents',
      refetch,
    })
    expect(screen.getByText('Failed to load incidents')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalled()
  })
})
