import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Header } from '../components/layout/Header'

describe('Header', () => {
  it('renders app title and analyst role chip by default', () => {
    render(<Header />)
    expect(screen.getByText('SentinelFusion')).toBeInTheDocument()
    expect(screen.getByText('Analyst')).toBeInTheDocument()
  })

  it('renders the configured user role', () => {
    render(<Header userRole="field_ops" />)
    expect(screen.getByText('Field Ops')).toBeInTheDocument()
  })

  it('logs out when the logout button is clicked', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Log out'))
    expect(spy).toHaveBeenCalledWith('Log out clicked')
    spy.mockRestore()
  })
})
