import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorState } from '../components/common/ErrorState'

describe('ErrorState', () => {
  it('renders the error message', () => {
    render(<ErrorState message="Server error. Please try again later." onRetry={vi.fn()} />)
    expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()
  })

  it('calls onRetry when Retry is clicked', () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Data not found." onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('logs the message when Report Issue is clicked', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    render(<ErrorState message="boom" onRetry={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Report Issue' }))
    expect(spy).toHaveBeenCalledWith('Report issue', 'boom')
    spy.mockRestore()
  })
})
