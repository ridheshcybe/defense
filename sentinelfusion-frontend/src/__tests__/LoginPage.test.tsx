import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { renderWithAuth, TEST_USER_ANALYST, TEST_USER_FIELD_OPS } from '../test/testUtils'
import type { User } from '../types'

function renderLogin(loginMock: (email: string, password: string) => Promise<User>) {
  return renderWithAuth(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/analyst" element={<div>Analyst dashboard</div>} />
        <Route path="/field-ops" element={<div>Field Ops dashboard</div>} />
      </Routes>
    </MemoryRouter>,
    { login: loginMock },
  )
}

function fillForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

describe('LoginPage', () => {
  it('renders email and password fields plus the demo account chips', () => {
    renderLogin(vi.fn().mockResolvedValue(TEST_USER_ANALYST))
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByText('Remember me')).toBeInTheDocument()
    expect(screen.getByText('Forgot password?')).toBeInTheDocument()
    expect(screen.getByText(/analyst · analyst@fusion.dev/)).toBeInTheDocument()
  })

  it('shows validation errors for invalid input', () => {
    renderLogin(vi.fn().mockResolvedValue(TEST_USER_ANALYST))
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
  })

  it('rejects a malformed email and a short password', () => {
    renderLogin(vi.fn().mockResolvedValue(TEST_USER_ANALYST))
    fillForm('not-an-email', '123')
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 6 characters.')).toBeInTheDocument()
  })

  it('calls login() with the entered credentials on submit', async () => {
    const loginMock = vi.fn().mockResolvedValue(TEST_USER_ANALYST)
    renderLogin(loginMock)
    fillForm('analyst@fusion.dev', 'analyst123')
    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('analyst@fusion.dev', 'analyst123'))
  })

  it('navigates to the role dashboard after successful login', async () => {
    const loginMock = vi.fn().mockResolvedValue(TEST_USER_FIELD_OPS)
    renderLogin(loginMock)
    fillForm('ops@fusion.dev', 'ops123')
    expect(await screen.findByText('Field Ops dashboard')).toBeInTheDocument()
  })

  it('shows an error message when login fails', async () => {
    const loginMock = vi.fn().mockRejectedValue(new Error('Invalid email or password.'))
    renderLogin(loginMock)
    fillForm('analyst@fusion.dev', 'wrongpass')
    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Invalid email or password.',
    )
  })

  it('autofills credentials when a demo account chip is clicked', () => {
    renderLogin(vi.fn().mockResolvedValue(TEST_USER_ANALYST))
    fireEvent.click(screen.getByText(/analyst · analyst@fusion.dev/))
    expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe(
      'analyst@fusion.dev',
    )
    expect((screen.getByLabelText(/password/i) as HTMLInputElement).value).toBe('analyst123')
  })
})
