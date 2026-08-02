import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import * as authApi from '../api/authApi'
import type { User } from '../types'

vi.mock('../api/authApi', () => ({
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  refreshToken: vi.fn(),
  isTokenExpired: (token: string) => token === 'expired-token',
  decodeToken: () => ({ exp: Date.now() + 90_000, role: 'analyst' }),
  DEMO_ACCOUNTS: [],
}))

const ANALYST_USER: User = {
  id: 'u-analyst',
  email: 'analyst@fusion.dev',
  name: 'Aria Singh',
  role: 'analyst',
}

function Probe() {
  const { user, token, isAuthenticated, isLoading, login, logout, refreshToken } = useAuth()
  return (
    <div>
      <span data-testid="user">{user?.name ?? 'none'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <button type="button" onClick={() => void login('analyst@fusion.dev', 'analyst123')}>
        login
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
      <button type="button" onClick={() => void refreshToken()}>
        refresh
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('logs in and exposes the user, token and authenticated state', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'access-token-1',
      refreshToken: 'rt.abc',
      user: ANALYST_USER,
    })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    // checkAuth resolves empty on first render.
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    fireEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Aria Singh'))
    expect(screen.getByTestId('token').textContent).toBe('access-token-1')
    expect(screen.getByTestId('auth').textContent).toBe('true')
    // Persisted so a reload restores the session.
    expect(window.localStorage.getItem('sf.token')).toBe('access-token-1')
    expect(window.localStorage.getItem('sf.user')).toContain('Aria Singh')
  })

  it('logs out and clears the session (state and storage)', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'access-token-1',
      refreshToken: 'rt.abc',
      user: ANALYST_USER,
    })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    fireEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'))
    fireEvent.click(screen.getByText('logout'))
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(screen.getByTestId('token').textContent).toBe('none')
    expect(window.localStorage.getItem('sf.token')).toBeNull()
    expect(window.localStorage.getItem('sf.user')).toBeNull()
    expect(authApi.logout).toHaveBeenCalledWith('access-token-1')
  })

  it('restores an existing session on checkAuth', async () => {
    window.localStorage.setItem('sf.token', 'restored-token')
    window.localStorage.setItem(
      'sf.user',
      JSON.stringify({ id: 'u-analyst', email: 'a@f.dev', name: 'Aria', role: 'analyst' }),
    )
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('Aria')
    expect(screen.getByTestId('token').textContent).toBe('restored-token')
    expect(screen.getByTestId('auth').textContent).toBe('true')
    // No network call happened for a valid stored token.
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('refreshes the access token via the refresh token', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'access-token-1',
      refreshToken: 'rt.abc',
      user: ANALYST_USER,
    })
    vi.mocked(authApi.refreshToken).mockResolvedValue({
      token: 'access-token-2',
      refreshToken: 'rt.def',
    })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    fireEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('token').textContent).toBe('access-token-1'))
    fireEvent.click(screen.getByText('refresh'))
    await waitFor(() => expect(screen.getByTestId('token').textContent).toBe('access-token-2'))
    expect(authApi.refreshToken).toHaveBeenCalledWith('rt.abc')
    expect(screen.getByTestId('user').textContent).toBe('Aria Singh')
    expect(screen.getByTestId('auth').textContent).toBe('true')
  })

  it('stores the session in sessionStorage when remember-me is off', async () => {
    window.localStorage.setItem('sf.remember', '0')
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'access-token-1',
      refreshToken: 'rt.abc',
      user: ANALYST_USER,
    })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    fireEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'))
    expect(window.sessionStorage.getItem('sf.token')).toBe('access-token-1')
    expect(window.localStorage.getItem('sf.token')).toBeNull()
  })
})
