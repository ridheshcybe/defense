import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProfilePage } from '../pages/ProfilePage'
import { renderWithAuth, TEST_USER_ANALYST } from '../test/testUtils'

function renderProfile(logout = vi.fn()) {
  return renderWithAuth(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
    { user: TEST_USER_ANALYST, isAuthenticated: true, logout },
  )
}

describe('ProfilePage', () => {
  it('shows the signed-in user name, email and role', () => {
    renderProfile()
    expect(screen.getByText('Aria Singh')).toBeInTheDocument()
    expect(screen.getByText('analyst@fusion.dev')).toBeInTheDocument()
    expect(screen.getByText('Analyst')).toBeInTheDocument()
    expect(screen.getByText('AS')).toBeInTheDocument() // avatar initials
  })

  it('logs out and redirects to /login', () => {
    const logout = vi.fn()
    renderProfile(logout)
    fireEvent.click(screen.getByTestId('logout-button'))
    expect(logout).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('validates the change-password form', () => {
    renderProfile()
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(screen.getByText('Enter your current password.')).toBeInTheDocument()
    expect(screen.getByText('Enter a new password.')).toBeInTheDocument()
    expect(screen.getByText('Confirm the new password.')).toBeInTheDocument()
  })

  it('rejects a mismatched password confirmation', () => {
    renderProfile()
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'old-pass' },
    })
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'new-pass-1' },
    })
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'different' },
    })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })
})
