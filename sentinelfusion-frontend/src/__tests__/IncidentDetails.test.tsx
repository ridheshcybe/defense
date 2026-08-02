import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IncidentDetails } from '../components/fieldops/IncidentDetails'
import { MOCK_FIELD_OPS_USERS, MOCK_INCIDENTS } from '../data/mockData'

const incident = MOCK_INCIDENTS[1] // inc-2, assigned to user-1, status in-progress
const openIncident = MOCK_INCIDENTS[0] // inc-1, status open (Start enabled)

function renderDetails(overrides: Partial<Parameters<typeof IncidentDetails>[0]> = {}) {
  const props = {
    incident,
    currentUser: MOCK_FIELD_OPS_USERS[0],
    users: MOCK_FIELD_OPS_USERS,
    onUpdateStatus: vi.fn().mockResolvedValue(undefined),
    onAddNote: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  const utils = render(<IncidentDetails {...props} />)
  return { props, utils }
}

describe('IncidentDetails', () => {
  it('renders the full incident details', () => {
    renderDetails()
    expect(screen.getByText('Unusual Movement')).toBeInTheDocument()
    expect(screen.getByText(/Coordinated convoy/i)).toBeInTheDocument()
    expect(screen.getByText('Status: In Progress')).toBeInTheDocument()
    expect(screen.getByText('Assigned to me')).toBeInTheDocument()
    expect(screen.getByText('Status changed: Open → In Progress')).toBeInTheDocument()
  })

  it('calls onUpdateStatus with in-progress when Start is clicked', () => {
    const { props } = renderDetails({ incident: openIncident })
    fireEvent.click(screen.getByRole('button', { name: /Start/ }))
    expect(props.onUpdateStatus).toHaveBeenCalledWith('in-progress')
  })

  it('calls onUpdateStatus with resolved when Complete is clicked', () => {
    const { props } = renderDetails()
    fireEvent.click(screen.getByRole('button', { name: /Complete/ }))
    expect(props.onUpdateStatus).toHaveBeenCalledWith('resolved')
  })

  it('adds a note through the Add Note dialog', async () => {
    const { props } = renderDetails()
    fireEvent.click(screen.getByRole('button', { name: /Add Note/ }))
    const textbox = screen.getByLabelText('Note')
    fireEvent.change(textbox, { target: { value: 'Convoy confirmed heading north' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() =>
      expect(props.onAddNote).toHaveBeenCalledWith('Convoy confirmed heading north'),
    )
  })

  it('renders a Google Maps link for the location', () => {
    renderDetails()
    const navigate = screen.getByRole('link', { name: /Navigate/ })
    expect(navigate).toHaveAttribute('href', `https://www.google.com/maps?q=${incident.location.lat},${incident.location.lng}`)
  })
})
