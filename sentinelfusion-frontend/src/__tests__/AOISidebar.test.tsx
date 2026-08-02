import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { AOISidebar } from '../components/aoi/AOISidebar'
import { renderWithAnalyst } from '../test/testUtils'
import { MOCK_AOIS } from '../data/mockData'

describe('AOISidebar', () => {
  it('renders AOI list with correct names', () => {
    renderWithAnalyst(<AOISidebar />, { aois: MOCK_AOIS })
    expect(screen.getByText('Mumbai Central')).toBeInTheDocument()
    expect(screen.getByText('Bandra West')).toBeInTheDocument()
    expect(screen.getByText('Colaba Causeway')).toBeInTheDocument()
  })

  it('filters AOIs when search input changes', async () => {
    renderWithAnalyst(<AOISidebar />, { aois: MOCK_AOIS })
    fireEvent.change(screen.getByPlaceholderText('Search AOIs…'), {
      target: { value: 'bandra' },
    })
    await waitFor(() => {
      expect(screen.queryByText('Mumbai Central')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Bandra West')).toBeInTheDocument()
  })

  it('calls selectAOI when an AOI is clicked', () => {
    const selectAOI = vi.fn()
    renderWithAnalyst(<AOISidebar />, { aois: MOCK_AOIS, selectAOI })
    fireEvent.click(screen.getByText('Mumbai Central'))
    expect(selectAOI).toHaveBeenCalledWith(MOCK_AOIS[0])
  })

  it('shows "No AOIs found" when filter returns empty', async () => {
    renderWithAnalyst(<AOISidebar />, { aois: MOCK_AOIS })
    fireEvent.change(screen.getByPlaceholderText('Search AOIs…'), {
      target: { value: 'zzz-not-a-real-aoi' },
    })
    await screen.findByText('No AOIs found')
  })

  it('shows a spinner while loading', () => {
    renderWithAnalyst(<AOISidebar />, { aois: [], isLoading: true })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows an error alert and retries via refetch', () => {
    const refetch = vi.fn()
    renderWithAnalyst(<AOISidebar />, { aois: [], error: 'Failed to load AOIs', refetch })
    expect(screen.getByText('Failed to load AOIs')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalled()
  })

  it('shows a Create AOI button', () => {
    renderWithAnalyst(<AOISidebar />, { aois: MOCK_AOIS })
    expect(screen.getByRole('button', { name: /create aoi/i })).toBeInTheDocument()
  })

  it('opens the AOIForm in create mode when Create AOI is clicked', async () => {
    renderWithAnalyst(<AOISidebar />, { aois: MOCK_AOIS })
    fireEvent.click(screen.getByRole('button', { name: /create aoi/i }))
    await screen.findByLabelText('Name')
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('shows edit/delete icons for each AOI', () => {
    renderWithAnalyst(<AOISidebar />, { aois: MOCK_AOIS })
    expect(screen.getAllByLabelText('Edit AOI')).toHaveLength(MOCK_AOIS.length)
    expect(screen.getAllByLabelText('Delete AOI')).toHaveLength(MOCK_AOIS.length)
  })

  it('opens the DeleteConfirmationDialog when delete is clicked', async () => {
    renderWithAnalyst(<AOISidebar />, { aois: MOCK_AOIS })
    fireEvent.click(screen.getAllByLabelText('Delete AOI')[0])
    await screen.findByText(/Are you sure you want to delete AOI/)
  })

  it('calls deleteAOI when deletion is confirmed', async () => {
    const deleteAOI = vi.fn().mockResolvedValue(undefined)
    renderWithAnalyst(<AOISidebar />, { aois: MOCK_AOIS, deleteAOI })
    fireEvent.click(screen.getAllByLabelText('Delete AOI')[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleteAOI).toHaveBeenCalledWith('aoi-1'))
  })
})
