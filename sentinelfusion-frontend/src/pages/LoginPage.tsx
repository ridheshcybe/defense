import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Login as LoginIcon } from '@mui/icons-material'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { User, UserRole } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { DEMO_ACCOUNTS } from '../api/authApi'
import { REMEMBER_KEY } from '../api/session'

const ROLE_HOME: Record<UserRole, string> = {
  analyst: '/analyst',
  field_ops: '/field-ops',
  leadership: '/leadership',
  crew_transport: '/crew-transport',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function NavigateRole({ user }: { user: User }) {
  return <Navigate to={ROLE_HOME[user.role]} replace />
}

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(
    () => window.localStorage.getItem(REMEMBER_KEY) !== '0',
  )
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in — jump straight to the role dashboard.
  if (isAuthenticated && user) {
    return <NavigateRole user={user} />
  }

  const from = (location.state as { from?: string } | null)?.from

  function validate(): boolean {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) next.email = 'Email is required.'
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    setError(null)
    setSubmitting(true)
    try {
      const signedInUser = await login(email, password)
      navigate(from ?? ROLE_HOME[signedInUser.role], { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 400, p: 3 }}>
        <Stack spacing={2}>
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              SentinelFusion
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to the intelligence platform
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" data-testid="login-error">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                fullWidth
                autoFocus
                autoComplete="email"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={Boolean(errors.password)}
                helperText={errors.password}
                fullWidth
                autoComplete="current-password"
              />
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remember}
                      onChange={(event) => {
                        const checked = event.target.checked
                        setRemember(checked)
                        window.localStorage.setItem(REMEMBER_KEY, checked ? '1' : '0')
                      }}
                      size="small"
                    />
                  }
                  label="Remember me"
                />
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  underline="hover"
                  onClick={() => console.log('Forgot password flow (not wired yet)')}
                >
                  Forgot password?
                </Link>
              </Stack>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </Box>

          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Demo accounts — click to autofill:
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {DEMO_ACCOUNTS.map((account) => (
                <Chip
                  key={account.email}
                  label={`${account.user.role.replace('_', ' ')} · ${account.email}`}
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(account.password)
                    setErrors({})
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Card>
    </Box>
  )
}
