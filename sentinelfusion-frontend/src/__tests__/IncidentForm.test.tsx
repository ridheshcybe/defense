import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { IncidentForm } from '../components/incidents/IncidentForm'
import { renderWithAnalyst } from '../test/testUtils'
import { MOCK_AOIS } from '../data/mockData'

function renderCreate() {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  renderWithAnalyst(
    <IncidentForm mode="create" initialData={null} onSubmit={onSubmit} onCancel={onCancel} />,
    { aois: MOCK_AOIS },
  )
  return { onSubmit, onCancel }
}

describe('IncidentForm', () => {
  it('renders all form fields in create mode', () => {
    renderCreate()
    expect(screen.getByText('Create Incident')).toBeInTheDocument()
    expect(screen.getByLabelText('Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Severity')).toBeInTheDocument()
    expect(screen.getByLabelText('Location Latitude')).toBeInTheDocument()
    expect(screen.getByLabelText('Location Longitude')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Associated AOI')).toBeInTheDocument()
    expect(screen.getByLabelText('Tags')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('shows validation errors for required fields', () => {
    renderCreate()
    expect(screen.getByText('Type is required.')).toBeInTheDocument()
    expect(screen.getByText('Severity is required.')).toBeInTheDocument()
    expect(screen.getByText('Description is required.')).toBeInTheDocument()
    expect(screen.getByText('Associated AOI is required.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('calls onSubmit with the correct data when the form is valid', async () => {
    const { onSubmit } = renderCreate()
    fireEvent.mouseDown(screen.getByLabelText('Type'))
    fireEvent.click(await screen.findByRole('option', { name: 'Protest' }))
    fireEvent.mouseDown(screen.getByLabelText('Severity'))
    fireEvent.click(await screen.findByRole('option', { name: 'critical' }))
    fireEvent.change(screen.getByLabelText('Location Latitude'), { target: { value: '18.92' } })
    fireEvent.change(screen.getByLabelText('Location Longitude'), { target: { value: '72.83' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test incident' } })
    fireEvent.mouseDown(screen.getByLabelText('Associated AOI'))
    fireEvent.click(await screen.findByRole('option', { name: 'Mumbai Central' }))
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'urban, high-risk' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(onSubmit).toHaveBeenCalledWith({
      type: 'protest',
      severity: 'critical',
      location: { lat: 18.92, lng: 72.83 },
      description: 'Test incident',
      aoiId: 'aoi-1',
      tags: ['urban', 'high-risk'],
    })
  })

  it('populates the AOI dropdown from context aois', async () => {
    renderCreate()
    fireEvent.mouseDown(screen.getByLabelText('Associated AOI'))
    expect(await screen.findByRole('option', { name: 'Mumbai Central' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Bandra West' })).toBeInTheDocument()
  })

  it('calls onCancel when the cancel button is clicked', () => {
    const { onCancel } = renderCreate()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
