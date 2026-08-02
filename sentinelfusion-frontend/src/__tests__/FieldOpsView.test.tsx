import { fireEvent, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FieldOpsView } from '../pages/FieldOpsView'
import { resetFieldOpsStore } from '../api/fieldOpsApi'
import { renderWithAuth } from '../test/testUtils'

function renderView() {
  return renderWithAuth(
    <MemoryRouter>
      <FieldOpsView />
    </MemoryRouter>,
  )
}

describe('FieldOpsView', () => {
  beforeEach(() => {
    resetFieldOpsStore()
    vi.clearAllMocks()
  })

  it('renders the incident list after loading', async () => {
    renderView()
    // Loading spinner first, then assigned cards (inc-2, inc-3, inc-6).
    expect(screen.getByLabelText('Loading incidents')).toBeInTheDocument()
    expect(await screen.findByText('Unusual Movement')).toBeInTheDocument()
    expect(screen.getByText('Protest')).toBeInTheDocument()
    expect(screen.getByText('Weapons')).toBeInTheDocument()
    expect(screen.getAllByText('Assigned to me').length).toBeGreaterThan(0)
  })

  it('filters incidents by status', async () => {
    renderView()
    await screen.findByText('Weapons')
    fireEvent.mouseDown(screen.getByLabelText('Status'))
    const openOption = await screen.findByRole('option', { name: 'Open' })
    fireEvent.click(openOption)
    await waitFor(() => expect(screen.getByText('Weapons')).toBeInTheDocument())
    // inc-3 (Protest) and inc-2 (Unusual Movement) are in-progress → filtered out.
    expect(screen.queryByText('Protest')).not.toBeInTheDocument()
    expect(screen.queryByText('Unusual Movement')).not.toBeInTheDocument()
  })

  it('shows incident details when an incident is tapped', async () => {
    renderView()
    fireEvent.click(await screen.findByText('Weapons'))
    await waitFor(() =>
      expect(
        screen.getByText(/Unconfirmed report of weapons cache movement/i),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText(/Status: Open/)).toBeInTheDocument()
  })

  it('updates status when the Start action is clicked', async () => {
    renderView()
    fireEvent.click(await screen.findByText('Weapons'))
    const startButton = await screen.findByRole('button', { name: /Start/ })
    fireEvent.click(startButton)
    await waitFor(() => expect(screen.getByText('Incident status updated')).toBeInTheDocument())
    expect(screen.getByText(/Status: In Progress/)).toBeInTheDocument()
  })

  it('opens Google Maps when Navigate is clicked', async () => {
    renderView()
    fireEvent.click(await screen.findByText('Weapons'))
    const navigate = await screen.findByRole('link', { name: /Navigate/ })
    expect(navigate).toHaveAttribute('href', expect.stringContaining('google.com/maps'))
    expect(navigate).toHaveAttribute('target', '_blank')
  })
})
