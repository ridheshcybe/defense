import { Box, Button, Stack, Typography } from '@mui/material'
import { Block } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import type { UserRole } from '../types'
import { useAuth } from '../contexts/AuthContext'

const ROLE_HOME: Record<UserRole, string> = {
  analyst: '/analyst',
  field_ops: '/field-ops',
  leadership: '/leadership',
  crew_transport: '/crew-transport',
}

const ROLE_LABELS: Record<UserRole, string> = {
  analyst: 'Analyst',
  field_ops: 'Field Ops',
  leadership: 'Leadership',
  crew_transport: 'Crew Transport',
}

export function UnauthorizedPage() {
  const { user, logout } = useAuth()

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
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Block color="error" sx={{ fontSize: 56 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Access denied
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {user
            ? `Your ${ROLE_LABELS[user.role]} account doesn't have permission to view this page.`
            : 'You are not signed in.'}
        </Typography>
        <Stack direction="row" spacing={1}>
          {user && (
            <Button component={Link} to={ROLE_HOME[user.role]} variant="contained">
              Go to my dashboard
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => {
              logout()
            }}
            component={Link}
            to="/login"
          >
            Sign in as another user
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
