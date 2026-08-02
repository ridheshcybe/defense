import { AppBar, Chip, IconButton, Toolbar, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { Logout } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import type { UserRole } from '../../types'

interface HeaderProps {
  userRole?: UserRole
  /** Optional real logout handler; falls back to a demo console.log when omitted. */
  onLogout?: () => void
}

const ROLE_LABELS: Record<UserRole, string> = {
  analyst: 'Analyst',
  field_ops: 'Field Ops',
  leadership: 'Leadership',
  crew_transport: 'Crew Transport',
}

export function Header({ userRole = 'analyst', onLogout }: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar sx={{ minHeight: 48, px: 2, gap: 1 }}>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, fontWeight: 700, fontSize: isMobile ? '1rem' : '1.25rem' }}
        >
          {isMobile ? 'SF' : 'SentinelFusion'}
        </Typography>
        <Chip label={ROLE_LABELS[userRole]} color="info" size="small" />
        <Tooltip title="Log out">
          <IconButton
            color="inherit"
            size="small"
            aria-label="Log out"
            onClick={() => (onLogout ? onLogout() : console.log('Log out clicked'))}
          >
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}
