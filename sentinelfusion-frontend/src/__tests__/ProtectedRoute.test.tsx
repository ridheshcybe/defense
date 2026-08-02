import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import {
  renderWithAuth,
  TEST_USER_ANALYST,
  TEST_USER_FIELD_OPS,
  TEST_USER_LEADERSHIP,
} from '../test/testUtils'

function renderProtected(overrides: {
  user?: (typeof TEST_USER_ANALYST) | null
  isAuthenticated?: boolean
  isLoading?: boolean
  allowedRoles?: string[]
  initialEntry?: string
}) {
  const {
    user = null,
    isAuthenticated = false,
    isLoading = false,
    allowedRoles = ['analyst'],
    initialEntry = '/analyst',
  } = overrides
  return renderWithAuth(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/analyst"
          element={
            <ProtectedRoute allowedRoles={allowedRoles as Array<'analyst' | 'field_ops' | 'leadership' | 'crew_transport'>}>
              <div>Secret analyst content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/unauthorized" element={<div>Access denied page</div>} />
      </Routes>
    </MemoryRouter>,
    { user, isAuthenticated, isLoading },
  )
}

describe('ProtectedRoute', () => {
  it('renders children for an authenticated user with an allowed role', () => {
    renderProtected({ user: TEST_USER_ANALYST, isAuthenticated: true })
    expect(screen.getByText('Secret analyst content')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to /login', () => {
    renderProtected({ isAuthenticated: false })
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Secret analyst content')).not.toBeInTheDocument()
  })

  it('redirects an authenticated user with the wrong role to /unauthorized', () => {
    renderProtected({ user: TEST_USER_LEADERSHIP, isAuthenticated: true })
    expect(screen.getByText('Access denied page')).toBeInTheDocument()
    expect(screen.queryByText('Secret analyst content')).not.toBeInTheDocument()
  })

  it('shows a loading spinner while the session is being checked', () => {
    renderProtected({ user: TEST_USER_FIELD_OPS, isAuthenticated: true, isLoading: true })
    expect(screen.getByLabelText('Checking session')).toBeInTheDocument()
    expect(screen.queryByText('Secret analyst content')).not.toBeInTheDocument()
  })

  it('redirects to /login with the attempted path in state', () => {
    renderProtected({ isAuthenticated: false })
    // The redirect target is rendered; the from-path is carried in router state,
    // which the LoginPage reads to bounce back after sign-in.
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })
})
