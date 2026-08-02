import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BottomNavigation, BottomNavigationAction, Button, Dialog, DialogActions,
  DialogContent, DialogTitle, Typography,
} from '@mui/material'
import { AccountCircle, Home, ListAlt } from '@mui/icons-material'

interface FieldOpsBottomNavProps {
  userName: string
}

export function FieldOpsBottomNav({ userName }: FieldOpsBottomNavProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState(1) // 1 = Incidents (default view)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <BottomNavigation
        value={tab}
        showLabels
        onChange={(_, next) => {
          setTab(next)
          if (next === 0) navigate('/')
          if (next === 2) setProfileOpen(true)
        }}
        sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <BottomNavigationAction label="Home" icon={<Home />} />
        <BottomNavigationAction label="Incidents" icon={<ListAlt />} />
        <BottomNavigationAction label="Profile" icon={<AccountCircle />} />
      </BottomNavigation>

      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Profile</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1">{userName}</Typography>
          <Typography variant="body2" color="text.secondary">
            Field Ops operator
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
