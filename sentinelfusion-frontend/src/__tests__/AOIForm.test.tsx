import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AOIForm } from '../components/aoi/AOIForm'
import { MOCK_AOIS } from '../data/mockData'

function renderCreate() {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  render(<AOIForm mode="create" initialData={null} onSubmit={onSubmit} onCancel={onCancel} />)
  return { onSubmit, onCancel }
}

describe('AOIForm', () => {
  it('renders all form fields in create mode', () => {
    renderCreate()
    expect(screen.getByText('Create AOI')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Center Latitude')).toBeInTheDocument()
    expect(screen.getByLabelText('Center Longitude')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Tags')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('renders form with initialData in edit mode', () => {
    const aoi = MOCK_AOIS[0]
    render(<AOIForm mode="edit" initialData={aoi} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Edit AOI')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Mumbai Central')
    expect(screen.getByLabelText('Center Latitude')).toHaveValue(aoi.center.lat)
    expect(screen.getByLabelText('Center Longitude')).toHaveValue(aoi.center.lng)
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('shows a validation error for an empty name', () => {
    renderCreate()
    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('shows validation errors for invalid latitude and longitude', () => {
    renderCreate()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Valid Name' } })
    fireEvent.change(screen.getByLabelText('Center Latitude'), { target: { value: '200' } })
    fireEvent.change(screen.getByLabelText('Center Longitude'), { target: { value: '999' } })
    expect(screen.getByText('Latitude must be between -90 and 90.')).toBeInTheDocument()
    expect(screen.getByText('Longitude must be between -180 and 180.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('calls onSubmit with the correct data when the form is valid', () => {
    const { onSubmit } = renderCreate()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Hub' } })
    fireEvent.change(screen.getByLabelText('Center Latitude'), { target: { value: '18.5' } })
    fireEvent.change(screen.getByLabelText('Center Longitude'), { target: { value: '72.9' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test site' } })
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'urban, tier-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'New Hub',
      center: { lat: 18.5, lng: 72.9 },
      description: 'Test site',
      tags: ['urban', 'tier-1'],
    })
  })

  it('calls onCancel when the cancel button is clicked', () => {
    const { onCancel } = renderCreate()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
