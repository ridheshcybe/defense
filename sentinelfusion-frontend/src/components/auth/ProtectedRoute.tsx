import { Box, CircularProgress } from '@mui/material'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { UserRole } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress aria-label="Checking session" />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
