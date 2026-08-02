import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'

function renderDialog() {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog
      title="Delete AOI"
      message="Are you sure you want to delete AOI 'Mumbai Central'? This action cannot be undone."
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('renders the title and message', () => {
    renderDialog()
    expect(screen.getByText('Delete AOI')).toBeInTheDocument()
    expect(
      screen.getByText("Are you sure you want to delete AOI 'Mumbai Central'? This action cannot be undone."),
    ).toBeInTheDocument()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const { onCancel } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('calls onConfirm when Delete is clicked', () => {
    const { onConfirm } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
