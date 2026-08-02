import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { UnauthorizedPage } from './pages/UnauthorizedPage'
import { AnalystView } from './pages/AnalystView'
import { FieldOpsView } from './pages/FieldOpsView'
import { LeadershipView } from './pages/LeadershipView'
import { CrewTransportView } from './pages/CrewTransportView'
import { OnboardingWizard } from './pages/OnboardingWizard'
import type { UserRole } from './types'

const ALL_ROLES: UserRole[] = ['analyst', 'field_ops', 'leadership', 'crew_transport']

const ROLE_LABELS: Record<UserRole, string> = {
  analyst: 'Analyst',
  field_ops: 'Field Ops',
  leadership: 'Leadership',
  crew_transport: 'Crew Transport',
}

function Home() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <Box
      sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          SentinelFusion
        </Typography>
        <Typography color="text.secondary">AOI-centric defence intelligence platform</Typography>

        {isAuthenticated && user ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">
              Signed in as <strong>{user.name}</strong>
            </Typography>
            <Chip label={ROLE_LABELS[user.role]} color="info" size="small" />
            <Button component={Link} to="/profile" variant="outlined" size="small">
              Profile
            </Button>
            <Button variant="text" size="small" color="error" onClick={logout}>
              Log out
            </Button>
          </Stack>
        ) : (
          <Button component={Link} to="/login" variant="contained">
            Log in
          </Button>
        )}

        <Button component={Link} to="/analyst" variant="contained">
          Open Analyst View
        </Button>
        <Button component={Link} to="/field-ops" variant="outlined">
          Open Field Ops View
        </Button>
        <Button component={Link} to="/leadership" variant="outlined">
          Open Leadership View
        </Button>
        <Button component={Link} to="/crew-transport" variant="outlined">
          Open Crew Transport View
        </Button>
        <Button component={Link} to="/onboarding" variant="outlined">
          Onboarding Wizard (T29)
        </Button>
      </Stack>
    </Box>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyst"
            element={
              <ProtectedRoute allowedRoles={['analyst']}>
                <AnalystView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/field-ops"
            element={
              <ProtectedRoute allowedRoles={['field_ops']}>
                <FieldOpsView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leadership"
            element={
              <ProtectedRoute allowedRoles={['leadership']}>
                <LeadershipView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crew-transport"
            element={
              <ProtectedRoute allowedRoles={['crew_transport']}>
                <CrewTransportView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              // No admin role exists yet; the analyst role is the closest
              // match for setup tasks until T29 adds a real admin role.
              <ProtectedRoute allowedRoles={['analyst']}>
                <OnboardingWizard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
