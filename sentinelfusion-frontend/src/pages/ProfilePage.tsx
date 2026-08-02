import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Logout } from '@mui/icons-material'
import { Navigate, useNavigate } from 'react-router-dom'
import type { UserRole } from '../types'
import { useAuth } from '../contexts/AuthContext'

const ROLE_LABELS: Record<UserRole, string> = {
  analyst: 'Analyst',
  field_ops: 'Field Ops',
  leadership: 'Leadership',
  crew_transport: 'Crew Transport',
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [current, setCurrent] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({})
  const [notice, setNotice] = useState<string | null>(null)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function validatePassword(): boolean {
    const next: { current?: string; next?: string; confirm?: string } = {}
    if (!current) next.current = 'Enter your current password.'
    if (!nextPassword) next.next = 'Enter a new password.'
    else if (nextPassword.length < 6) next.next = 'Password must be at least 6 characters.'
    if (!confirm) next.confirm = 'Confirm the new password.'
    else if (confirm !== nextPassword) next.confirm = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validatePassword()) return
    // Dummy — swap for a real change-password endpoint when the backend ships.
    setNotice('Password change is not wired to the backend yet.')
    setCurrent('')
    setNextPassword('')
    setConfirm('')
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
      <Stack spacing={2} sx={{ width: '100%', maxWidth: 440 }}>
        <Card variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2} alignItems="center">
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
              {initials(user.name)}
            </Avatar>
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Chip label={ROLE_LABELS[user.role]} color="info" size="small" />
            </Stack>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogout}
              data-testid="logout-button"
            >
              Log out
            </Button>
          </Stack>
        </Card>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Change password
          </Typography>
          <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Current password"
                type="password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
                error={Boolean(errors.current)}
                helperText={errors.current}
                fullWidth
                autoComplete="current-password"
              />
              <TextField
                label="New password"
                type="password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
                error={Boolean(errors.next)}
                helperText={errors.next}
                fullWidth
                autoComplete="new-password"
              />
              <TextField
                label="Confirm new password"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                error={Boolean(errors.confirm)}
                helperText={errors.confirm}
                fullWidth
                autoComplete="new-password"
              />
              <Button type="submit" variant="contained" fullWidth>
                Update password
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Stack>

      <Snackbar
        open={notice !== null}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  )
}
