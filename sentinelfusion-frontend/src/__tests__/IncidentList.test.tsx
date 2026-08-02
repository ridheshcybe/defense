import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IncidentList } from '../components/fieldops/IncidentList'
import { MOCK_INCIDENTS } from '../data/mockData'

const CURRENT_USER = 'user-1'

function renderList(incidents = MOCK_INCIDENTS) {
  return render(
    <IncidentList
      incidents={incidents}
      currentUserId={CURRENT_USER}
      selectedIncidentId={null}
      onSelect={vi.fn()}
    />,
  )
}

describe('IncidentList', () => {
  it('renders cards with type, severity, status and assigned chip', () => {
    renderList()
    // Show the full queue (assigned + unassigned) for rendering assertions.
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Threat')).toBeInTheDocument()
    // Two Protest incidents exist (inc-3, inc-7) once the full queue is shown.
    expect(screen.getAllByText('Protest').length).toBeGreaterThan(0)
    // inc-2 is assigned to user-1.
    expect(screen.getAllByText('Assigned to me').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0)
  })

  it('filters incidents by status', async () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    fireEvent.mouseDown(screen.getByLabelText('Status'))
    const resolved = await screen.findByRole('option', { name: 'Resolved' })
    fireEvent.click(resolved)
    // Only resolved incidents remain: inc-5 (Gathering) and inc-7 (Protest).
    expect(screen.getByText('Gathering')).toBeInTheDocument()
    expect(screen.queryByText('Threat')).not.toBeInTheDocument()
    expect(screen.queryByText('Unusual Movement')).not.toBeInTheDocument()
  })

  it('shows the empty state when the filter matches nothing', async () => {
    renderList()
    // Default "Assigned to me" view contains only inc-2 (in-progress); filtering
    // to Resolved leaves no matches.
    fireEvent.mouseDown(screen.getByLabelText('Status'))
    const resolved = await screen.findByRole('option', { name: 'Resolved' })
    fireEvent.click(resolved)
    expect(screen.getByText('No incidents match your filters.')).toBeInTheDocument()
  })

  it('toggles to include unassigned incidents via the assigned filter', () => {
    renderList()
    // Default: assigned to me only → inc-1 (Threat, unassigned) is hidden.
    expect(screen.queryByText('Threat')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    // Queue now includes open unassigned incidents: inc-1 (Threat).
    expect(screen.getByText('Threat')).toBeInTheDocument()
  })

  it('sorts by severity with critical first', () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    fireEvent.mouseDown(screen.getByLabelText('Sort'))
    // select 'Severity'
    const severityOption = screen.getAllByRole('option').find((el) => el.textContent === 'Severity')
    expect(severityOption).toBeTruthy()
    fireEvent.click(severityOption as HTMLElement)
    const cards = screen.getAllByTestId(/^incident-card-/)
    const firstCard = within(cards[0])
    // Critical incidents are inc-1 (Threat), inc-4 (Drug Shipment), inc-6 (Weapons).
    expect(
      ['Threat', 'Drug Shipment', 'Weapons'].some((label) => firstCard.queryByText(label)),
    ).toBe(true)
  })
})
