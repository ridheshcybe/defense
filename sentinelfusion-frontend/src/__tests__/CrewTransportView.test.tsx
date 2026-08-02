import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CrewTransportView } from '../pages/CrewTransportView'
import { resetCrewStore } from '../api/crewTransportApi'
import { renderWithAuth } from '../test/testUtils'

function renderView() {
  return renderWithAuth(
    <MemoryRouter>
      <CrewTransportView />
    </MemoryRouter>,
  )
}

describe('CrewTransportView', () => {
  beforeEach(() => {
    resetCrewStore()
    vi.clearAllMocks()
  })

  it('renders the assignment list after loading', async () => {
    renderView()
    // Loading spinner first, then the crew-1 assigned routes.
    expect(screen.getByLabelText('Loading assignments')).toBeInTheDocument()
    expect(await screen.findByText('Colaba Supply Run')).toBeInTheDocument()
    expect(screen.getByText('Bandra Relief Pickup')).toBeInTheDocument()
    expect(screen.getByText('Navi Mumbai Courier')).toBeInTheDocument()
    expect(screen.getAllByText('Assigned to me').length).toBeGreaterThan(0)
  })

  it('filters assignments by status', async () => {
    renderView()
    await screen.findByText('Colaba Supply Run')
    fireEvent.mouseDown(screen.getByLabelText('Status'))
    const completedOption = await screen.findByRole('option', { name: 'Completed' })
    fireEvent.click(completedOption)
    // Only tr-3 (Navi Mumbai Courier) is completed.
    expect(await screen.findByText('Navi Mumbai Courier')).toBeInTheDocument()
    expect(screen.queryByText('Colaba Supply Run')).not.toBeInTheDocument()
    expect(screen.queryByText('Bandra Relief Pickup')).not.toBeInTheDocument()
  })

  it('shows route details when an assignment is tapped', async () => {
    renderView()
    fireEvent.click(await screen.findByText('Colaba Supply Run'))
    // The origin→destination string appears in both the list card and the
    // RouteCard, so getAllByText is required.
    await waitFor(() =>
      expect(screen.getAllByText('Fusion HQ, Fort → Colaba Causeway AOI').length).toBeGreaterThan(0),
    )
    expect(screen.getByTestId('route-svg')).toBeInTheDocument()
    expect(screen.getByText(/Vehicle: Truck T-7/)).toBeInTheDocument()
    const navigate = screen.getByRole('link', { name: /Navigate/ })
    expect(navigate).toHaveAttribute('href', expect.stringContaining('google.com/maps/dir'))
    expect(navigate).toHaveAttribute('target', '_blank')
  })

  it('starts a planned route via the Start action', async () => {
    renderView()
    fireEvent.click(await screen.findByText('Colaba Supply Run'))
    const startButton = await screen.findByRole('button', { name: /Start route/ })
    fireEvent.click(startButton)
    await waitFor(() => expect(screen.getByText('Route started')).toBeInTheDocument())
    // tr-1 just became in-progress; tr-2 was already in-progress, so ≥2 chips.
    await waitFor(() => expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(2))
  })

  it('completes a route via the Complete action', async () => {
    renderView()
    fireEvent.click(await screen.findByText('Bandra Relief Pickup'))
    // Exact match: /Complete/ would also match the 'Navi Mumbai Courier' card,
    // whose accessible name contains 'Completed'.
    const completeButton = await screen.findByRole('button', { name: 'Complete' })
    fireEvent.click(completeButton)
    await waitFor(() => expect(screen.getByText('Route marked complete')).toBeInTheDocument())
    // tr-2 just completed; tr-3 was already completed, so ≥2 chips.
    await waitFor(() => expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(2))
  })

  it('adds a note to the route timeline', async () => {
    renderView()
    fireEvent.click(await screen.findByText('Bandra Relief Pickup'))
    fireEvent.click(await screen.findByRole('button', { name: /Add note/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(
      within(dialog).getByLabelText('Note'),
      { target: { value: 'Divert via Haji Ali' } },
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(screen.getByText('Note added')).toBeInTheDocument())
    expect(await screen.findByText('• Divert via Haji Ali (Kabir Rao)')).toBeInTheDocument()
  })

  it('shows an empty state when no assignment is selected', async () => {
    renderView()
    await screen.findByText('Colaba Supply Run')
    expect(screen.getByText('No route selected')).toBeInTheDocument()
  })
})
